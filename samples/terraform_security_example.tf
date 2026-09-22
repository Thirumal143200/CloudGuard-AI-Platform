# DEMO DATASET — SIMULATED FOR EVALUATION
# Insecure Terraform HCL definitions illustrating S3 and Security Group violations

resource "aws_s3_bucket" "insecure_archive_bucket" {
  bucket = "corp-customer-cold-archive-2026"
  acl    = "public-read"

  tags = {
    Environment = "Production"
    Evaluation  = "DEMO DATASET — SIMULATED FOR EVALUATION"
  }
}

resource "aws_security_group" "wide_open_ssh_sg" {
  name        = "sg-jumpbox-public"
  description = "Public Jumpbox Security Group"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Tier       = "Bastion"
    Evaluation = "DEMO DATASET — SIMULATED FOR EVALUATION"
  }
}
