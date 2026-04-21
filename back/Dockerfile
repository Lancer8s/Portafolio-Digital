# Backend Laravel 8 — PHP 7.4 CLI
FROM php:7.4-cli

# Instalar dependencias del sistema y extensiones PHP
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    libpq-dev \
    zip \
    unzip \
    && docker-php-ext-install pdo_pgsql mbstring exif pcntl bcmath gd \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Instalar Composer
COPY --from=composer:2.2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copiar archivos de dependencias primero (cache de layers)
COPY composer.json composer.lock ./

# Instalar dependencias PHP
RUN composer install --no-interaction --no-scripts --no-autoloader

# Copiar el resto del código
COPY . .

# Generar autoload optimizado
RUN composer dump-autoload --optimize

# Ajustar permisos para storage y bootstrap/cache
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]