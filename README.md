# BeTrusty MCP

Servidor MCP (Model Context Protocol) de BeTrusty. Expone herramientas para calcular precios de propiedades y consultar disponibilidad, listas para ser consumidas por cualquier cliente compatible con MCP (Claude Desktop, Cursor, etc.).

---

## Requisitos

- [Bun](https://bun.sh/) >= 1.x
- Acceso a la API de BeTrusty (`PRICING_API_BASE_URL`)

---

## Instalación

```bash
# 1. Instalar dependencias
bun install

# 2. Crear el archivo de entorno
cp .env.example .env.local
```

Editar `.env.local` y completar las variables:

```ini
PORT=3002                                    # Puerto del servidor (solo modo local/Docker)
PRICING_API_BASE_URL=https://app.betrusty.io # URL base de la API de BeTrusty
NODE_ENV=development                         # development | staging | production
```

> `PRICING_API_BASE_URL` es la **única variable obligatoria**.

---

## Levantar el servidor

### Desarrollo (hot reload)

```bash
bun run dev
```

### Producción

```bash
bun run build
bun run start
```

El servidor queda disponible en `http://localhost:3002` (o el `PORT` que hayas configurado).

---

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Healthcheck. Devuelve `{ status: "ok", timestamp, version }` |
| `POST` | `/mcp` | Endpoint principal del protocolo MCP (JSON-RPC) |
| `GET` | `/mcp` | No soportado — devuelve HTTP 405 (SSE deshabilitado) |

> El servidor es **stateless**. Cada `POST /mcp` es una solicitud independiente. No hay sesiones ni conexiones persistentes.

---

## Configurar un cliente MCP

### Claude Desktop

Editar el archivo de configuración de Claude Desktop:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "betrusty": {
      "url": "http://localhost:3002/mcp"
    }
  }
}
```

Reiniciar Claude Desktop. Las herramientas aparecerán disponibles automáticamente.

### Cursor

En Cursor, agregar el servidor en `Settings > MCP`:

```json
{
  "mcpServers": {
    "betrusty": {
      "url": "http://localhost:3002/mcp"
    }
  }
}
```

### Cualquier otro cliente MCP

El endpoint MCP es:

```
POST http://localhost:3002/mcp
Content-Type: application/json
```

El cliente debe enviar mensajes JSON-RPC 2.0 estándar. SSE (`GET /mcp`) no está soportado — el cliente debe operar en modo **HTTP POST solamente**.

---

## Herramientas disponibles

### `get_pricing`

Calcula el precio de una estadía en una propiedad. Devuelve desglose por noche, precio total, moneda, descuentos aplicados y cuotas.

**Parámetros:**

| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `propertyId` | `string` | Sí | ID de la propiedad en BeTrusty |
| `checkIn` | `string` | Sí | Fecha de entrada en formato `YYYY-MM-DD` |
| `checkOut` | `string` | Sí | Fecha de salida en formato `YYYY-MM-DD` |
| `roomId` | `string` | No | ID de la habitación. Usar `"null"` para reservar la propiedad completa (valor por defecto) |

**Respuesta:**

```json
{
  "nights": 3,
  "totalPrice": 450.00,
  "currency": "USD",
  "appliedDiscounts": [],
  "details": [
    { "concept": "Nightly rate", "value": 150.00 }
  ],
  "installments": [
    {
      "index": 1,
      "dueDate": "2026-04-01",
      "currency": "USD",
      "totalPrice": 450.00,
      "totalNights": 3,
      "details": [...],
      "breakdown": [...]
    }
  ]
}
```

---

### `get_unavailable_properties`

Devuelve los IDs de propiedades que **no están disponibles** (tienen al menos un evento de calendario que se superpone) para un rango de fechas dado. Útil para filtrar propiedades antes de mostrar disponibilidad.

**Parámetros:**

| Nombre | Tipo | Requerido | Descripción |
|--------|------|-----------|-------------|
| `checkIn` | `string` | Sí | Fecha de entrada en formato `YYYY-MM-DD` |
| `checkOut` | `string` | Sí | Fecha de salida en formato `YYYY-MM-DD` |

**Respuesta:**

```json
{
  "data": ["prop_123", "prop_456"]
}
```

---

## Despliegue

### Docker

```bash
docker build -t betrusty-mcp .
docker run -p 3002:3002 \
  -e PRICING_API_BASE_URL=https://app.betrusty.io \
  -e NODE_ENV=production \
  betrusty-mcp
```

### Vercel

1. Conectar el repositorio en el dashboard de Vercel.
2. Agregar la variable de entorno `PRICING_API_BASE_URL` en **Settings > Environment Variables**.
3. `PORT` **no** es necesario en Vercel — lo asigna automáticamente.
4. El build se ejecuta solo (`vercel.json` ya está configurado).

El endpoint MCP en Vercel será: `https://<tu-dominio>.vercel.app/mcp`

---

## Scripts disponibles

| Comando | Descripción |
|---------|-------------|
| `bun run dev` | Servidor de desarrollo con hot reload |
| `bun run build` | Compila el proyecto en `dist/` |
| `bun run start` | Ejecuta el build compilado |
| `bun run test` | Corre todos los tests |
| `bun run test:watch` | Tests en modo watch |
| `bun run typecheck` | Verificación de tipos TypeScript |
| `bun run lint` | Chequeo de lint con Biome |
| `bun run lint:fix` | Corrección automática de lint |
