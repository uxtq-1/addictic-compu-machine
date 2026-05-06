terraform {
  required_version = ">= 1.2.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "cafeteria-lite-terraform-state"
    prefix = "prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "run.googleapis.com",
    "sqladmin.googleapis.com",
    "storage-api.googleapis.com",
    "cloudfunctions.googleapis.com",
    "cloudscheduler.googleapis.com",
    "secretmanager.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "cloudkms.googleapis.com",
  ])

  service            = each.value
  disable_on_destroy = false
}

# Cloud SQL PostgreSQL Instance
resource "google_sql_database_instance" "postgres" {
  name             = "cafeteria-lite-${var.environment}-db"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier                        = "db-f1-micro"
    activation_policy           = "ALWAYS"
    availability_type           = "REGIONAL"
    enable_ssl                  = true
    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      location                       = var.region
      point_in_time_recovery_enabled = true
      backup_retention_settings {
        retained_backups = 7
        retention_unit   = "COUNT"
      }
    }
    database_flags {
      name  = "cloudsql_iam_authentication"
      value = "on"
    }
    ip_configuration {
      ipv4_enabled    = true
      private_network = google_compute_network.vpc.id
      require_ssl     = true
      authorized_networks {
        name  = "office"
        value = "0.0.0.0/0" # Restrict in production
      }
    }
  }

  deletion_protection = true

  depends_on = [google_project_service.required_apis]
}

# Database
resource "google_sql_database" "cafeteria" {
  name     = "cafeteria_lite_${var.environment}"
  instance = google_sql_database_instance.postgres.name
  charset  = "UTF8"
}

# Database user (for application)
resource "google_sql_user" "app_user" {
  name     = "app_user"
  instance = google_sql_database_instance.postgres.name
  password = random_password.db_password.result
}

# Random password for DB user
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store DB password in Secret Manager
resource "google_secret_manager_secret" "db_password" {
  secret_id           = "cafeteria-lite-db-password-${var.environment}"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}

# VPC Network
resource "google_compute_network" "vpc" {
  name                    = "cafeteria-lite-${var.environment}"
  auto_create_subnetworks = false
}

# Subnet
resource "google_compute_subnetwork" "subnet" {
  name          = "cafeteria-lite-subnet-${var.environment}"
  ip_cidr_range = "10.0.0.0/24"
  region        = var.region
  network       = google_compute_network.vpc.id
}

# Cloud Run Service Account
resource "google_service_account" "cloud_run" {
  account_id   = "cafeteria-lite-app-${var.environment}"
  display_name = "Cafeteria Lite App Service Account"
}

# Grant Cloud Run access to Secret Manager
resource "google_secret_manager_secret_iam_member" "cloud_run_secret_access" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Grant Cloud Run access to Cloud SQL
resource "google_project_iam_member" "cloud_run_sql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Cloud Storage Bucket for product images
resource "google_storage_bucket" "product_images" {
  name          = "cafeteria-lite-images-${var.project_id}-${var.environment}"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }

  # CORS for frontend
  cors {
    origin          = ["${var.frontend_url}"]
    method          = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    response_header = ["Content-Type", "x-goog-meta-custom"]
    max_age_seconds = 3600
  }
}

# IAM: Cloud Run access to Storage
resource "google_storage_bucket_iam_member" "cloud_run_storage" {
  bucket = google_storage_bucket.product_images.name
  role   = "roles/storage.admin"
  member = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Cloud Run Deployment (placeholder - actual config in later steps)
resource "google_cloud_run_service" "api" {
  name     = "cafeteria-lite-api-${var.environment}"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.cloud_run.email

      containers {
        image = "gcr.io/${var.project_id}/cafeteria-lite-api:latest"

        env {
          name  = "DB_HOST"
          value = google_sql_database_instance.postgres.private_ip_address
        }

        env {
          name  = "DB_NAME"
          value = google_sql_database.cafeteria.name
        }

        env {
          name  = "DB_USER"
          value = google_sql_user.app_user.name
        }

        env {
          name  = "NODE_ENV"
          value = var.environment
        }

        resources {
          limits = {
            cpu    = "1"
            memory = "512Mi"
          }
        }
      }

      timeout_seconds = 60
    }

    metadata {
      annotations = {
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.postgres.connection_name
        "run.googleapis.com/vpc-access-connector" = google_vpc_access_connector.connector.id
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.required_apis,
    google_sql_database.cafeteria,
  ]
}

# VPC Access Connector for Cloud Run to Cloud SQL
resource "google_vpc_access_connector" "connector" {
  name           = "cafeteria-lite-connector-${var.environment}"
  ip_cidr_range  = "10.8.0.0/28"
  region         = var.region
  network        = google_compute_network.vpc.name
  min_throughput = 200
  max_throughput = 300
}

# Cloud Run IAM: public access
resource "google_cloud_run_service_iam_member" "public" {
  service       = google_cloud_run_service.api.name
  location      = google_cloud_run_service.api.location
  role          = "roles/run.invoker"
  member        = "allUsers"
}

# Outputs
output "cloud_run_url" {
  value = google_cloud_run_service.api.status[0].url
}

output "cloud_sql_connection_name" {
  value = google_sql_database_instance.postgres.connection_name
}

output "product_images_bucket" {
  value = google_storage_bucket.product_images.name
}
