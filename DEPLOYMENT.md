# Deployment Guide for Stock AI

This project is configured for deployment on a Microsoft Azure VM using **Nginx**, **PM2**, and **GitHub Actions**.

## Prerequisites

On your Azure VM, ensure you have the following installed:
- Node.js & npm
- Python 3 & pip
- Git
- PM2 (`npm install -g pm2`)
- Nginx

## 1. Initial Server Setup

Run these commands on your VM to prepare the directory:
```bash
sudo mkdir -p /var/www/stockapp
sudo chown -R azureuser:azureuser /var/www/stockapp
cd /var/www/stockapp
git clone https://github.com/Rushi774545/Stock_Ai.git .
```

## 2. Nginx Configuration

1. Copy the provided `nginx.conf` to your Nginx sites-available directory:
   ```bash
   sudo cp nginx.conf /etc/nginx/sites-available/stockapp
   ```
2. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/stockapp /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 3. PM2 Backend Configuration

Initialize the backend process:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 4. GitHub Actions CI/CD Setup

Go to your GitHub repository **Settings > Secrets and variables > Actions** and add the following secrets:

- `VM_IP`: `70.153.18.179`
- `VM_USER`: `azureuser`
- `SSH_PRIVATE_KEY`: Paste the content of your `in.pem` file.
- `DJANGO_SECRET_KEY`: A secure random secret key for Django.

### **Domains Configured**
- **Frontend**: [https://frontend-stock-rushi.duckdns.org](https://frontend-stock-rushi.duckdns.org)
- **Backend API**: [https://backend-stock-rushi.duckdns.org/api/](https://backend-stock-rushi.duckdns.org/api/)

## Important Note on Paths

The CI/CD pipeline assumes the project is cloned into `/var/www/stockapp`. If you use a different path, update `.github/workflows/deploy.yml` accordingly.
