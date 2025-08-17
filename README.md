Overview
---------------
Proxymity is a small tool to generate NGINX configuration files from a services manifest and templates, and to export those configs either locally (generator) or to an external webhook (like a n8n Workflow). The frontend provides a compact UI to configure and trigger exports.

UI overview
-------------------------------------------

0) Dashoard
   - Still in development.

1) Templates
   - Templates define the structure of the generated NGINX server blocks. Each template is identified by a model key (examples provided are `Insecure`, `Authentik`, `basic`, respectively a simple insecure passtrhough, a page protected by Authentik, and a page protected by Basic-Auth). It contains placeholder variables the generator will replace.
   - When a service references a `Template`, the generator finds the template file and substitutes variables : ${SERVICE_NAME}, ${DOMAIN}, ${SUBDOMAIN}, ${PORT}, ${IP}, ${HTTPS} with the services data..

   ![Templates screenshot](screenshots/templates.png)

2) Services
   - The services manifest lists named services and per-service settings (subdomain, port, model, enabled, manual, etc.). The generator iterates services and generates one `.conf` per enabled service (unless marked `manual`, then it will leave the `.conf` untouched).
   - What to check in the UI: ensure each service that should be generated has a valid `Template` or the generator will skip it.

   ![Services screenshot](screenshots/services.png)

3) Setup window (main control area)
   - Open this windows by clicking the NGINX state widget (top-left) then clicking `SET UP`
   - Parameters:
     - NGINX Container table: lists Docker containers. Click a row to select the container used as a reference.
     - NGINX Directory: field for the root path where generated configurations and backups will be placed (in subfolders `sites-available` and `sites-available-backup`).
     - Export mode : choose `Default` (run the local generator) or `Webhook` (Call to an external deployment service).
     - Webhook URL: full endpoint used when in Webhook export mode.
     - Notifier: You can provide your Pushbullet API key and test it.

   ![Setup dialog screenshot](screenshots/setup-dialog.png)


Export flow (what happens when you trigger an export)
--------------------------------------------------

- If Export Mode is `Webhook` and Webhook URL is set: the backend sends the export order to that URL.
- If Export Mode is `Default`: the backend runs the generator which:
  - Loads the services manifest and templates metadata.
  - Merges in defaults (if provided).
  - Archives existing `.conf` files in `sites-availables-backup` and writes new `.conf` files into `sites-availables` under the configured NGINX directory.
  - Skips services marked `manual` or those without a model/template.

Minimal run instructions
------------------------

Two compose files are provided:

- `./compose.yml` — build the local image and run.
- `Release/compose.yml` — pull published images and run (edit the image name to match your registry if needed).


What's implemented
-------------------

- UI to manage templates/services/export settings and a live, clickable NGINX directory preview.
- Settings persistence (saved and reloaded).
- Generator to create `.conf` files from service data and templates, with archiving of previous confs.
- Export endpoint that supports webhook or generator and optional Pushbullet notifications.

What's missing / recommended next steps
-------------------------------------

- Dashboard: a summarized page with export history and per-service status (not complete).
- NGINX validation & reload: the generator doesn't run `nginx -t` or reload the server automatically — recommended to add a validation step and reload on success.
- Secrets handling: Pushbullet tokens are saved in plaintext in settings. For production, move secrets to a secure store.
- Harden `listdir`: restrict allowed roots or sanitize paths to avoid exposing the filesystem.

Troubleshooting
---------------

- If templates are missing: check your templates metadata and template files.
- If output ends up in the wrong folder: verify the `NGINX Directory` saved in Setup; exporter uses that as the root for generated files and backups.

Want me to implement one of these next?
- Add `nginx -t` + reload task wired into the export flow.
- Harden secrets handling.
- Add a basic exports dashboard.


