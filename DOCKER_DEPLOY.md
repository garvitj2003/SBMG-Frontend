# Deploy SBMG Frontend with Docker and Certbot

Deploy the frontend on **http://139.59.34.99:5173** using Docker. The app listens on **port 5173 (HTTP)** and **5174 (HTTPS)**. Port **8000** is left for your existing backend API; port **80** is not used (e.g. if already in use).

## Prerequisites

- Docker and Docker Compose on the server (139.59.34.99)
- Backend API running on the same host on port **8000** (unchanged)

## 1. Clone and configure

On the server:

```bash
cd /path/to/SBMG-Frontend
cp .env.example .env
# Edit .env: set VITE_GOOGLE_MAPS_API_KEY (and optionally DOMAIN for HTTPS)
nano .env
```

## 2. Build and run (HTTP only)

```bash
docker-compose build --no-cache --build-arg VITE_GOOGLE_MAPS_API_KEY="your_key"
docker-compose up -d frontend
```

- Frontend: **http://139.59.34.99:5173** (HTTP) and **https://139.59.34.99:5174** (HTTPS, after Certbot)
- API requests from the app go to `/api/v1` and are proxied to `http://host:8000/api/v1` (no CORS, same host)

Port **8000** is not used by this stack; it remains for your backend.

### Make it publicly visible

- **Use the server’s public URL**, not localhost: open **http://139.59.34.99:5173** (and **http://139.59.34.99:5173/dashboard**) from any device.
- **Open the firewall** on the server so port 5173 (and 5174 if using HTTPS) is allowed:
  ```bash
  sudo ufw allow 5173/tcp
  sudo ufw allow 5174/tcp
  sudo ufw reload
  sudo ufw status
  ```
  If you don’t use `ufw`, allow these ports in your cloud/security group (e.g. DigitalOcean firewall, AWS security group).

## 3. HTTPS with Certbot (optional)

Let's Encrypt only issues certificates for **domains**, not raw IPs. You need a domain (e.g. `sbmg.yourdomain.com`) pointing to `139.59.34.99`.

1. **Point DNS**  
   Create an A record: `sbmg.yourdomain.com` → `139.59.34.99`.

2. **Set domain in .env**  
   In `.env`:  
   `DOMAIN=sbmg.yourdomain.com`

3. **Start frontend so Certbot can use HTTP challenge**  
   ```bash
   docker-compose up -d frontend
   ```

4. **Obtain certificate (run once)**  
   Replace `sbmg.yourdomain.com` and `your@email.com`:

   ```bash
   docker-compose run --rm certbot certonly --webroot \
     -w /var/www/certbot \
     -d sbmg.yourdomain.com \
     -m your@email.com \
     --agree-tos --no-eff-email
   ```

5. **Restart frontend to load HTTPS**  
   ```bash
   docker-compose restart frontend
   ```

6. **Start Certbot renewal loop**  
   ```bash
   docker-compose up -d certbot
   ```

After this, the site is available at **https://sbmg.yourdomain.com**. Certbot will renew certificates automatically.

## 4. Useful commands

| Command | Purpose |
|--------|---------|
| `docker-compose up -d` | Start frontend + certbot |
| `docker-compose logs -f frontend` | View frontend logs |
| `docker-compose restart frontend` | Restart after config/cert changes |
| `docker-compose down` | Stop all services |

## Ports

| Port | Service |
|------|--------|
| **5173** | Frontend (HTTP) |
| **5174** | Frontend (HTTPS, after Certbot) |
| **8000** | Not used by this stack; reserved for your API |

## Troubleshooting

- **`KeyError: 'ContainerConfig'` when running `docker-compose up`**  
  Old docker-compose (e.g. 1.29.2) can hit this when recreating a container. Remove the container and start fresh (run on the server):
  ```bash
  docker rm -f sbmg-frontend
  docker-compose up -d frontend
  ```

- **API 502 / connection refused**  
  Ensure the backend is listening on port **8000** on the same host. The frontend container reaches it via `host.docker.internal:8000`.

- **HTTPS not working**  
  Check that `DOMAIN` in `.env` matches the name you used in `certbot certonly`, and that you restarted the frontend after obtaining the cert.

- **Google Maps errors**  
  Set `VITE_GOOGLE_MAPS_API_KEY` in `.env` and rebuild:  
  `docker-compose build --no-cache --build-arg VITE_GOOGLE_MAPS_API_KEY="your_key"`  
  Then add your production domain (and `http://139.59.34.99`) to the key’s HTTP referrer restrictions in Google Cloud Console.
