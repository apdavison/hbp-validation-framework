FROM nginx:alpine

RUN apk add --no-cache bash
COPY validation_framework_v2/build /usr/share/nginx/html/
COPY curation-dashboard/build /usr/share/nginx/html/curation-dashboard
COPY deployment/nginx-app.conf /etc/nginx/conf.d/default.conf
