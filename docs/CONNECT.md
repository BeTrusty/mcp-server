# Conectarse al MCP de BeTrusty

Guía para integrar el servidor MCP de BeTrusty en tu cliente de IA.

**Endpoint:**

```
https://mcp.betrusty.io/mcp
```

---

## Configuración por cliente

### Claude Desktop

Editar el archivo de configuración:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "betrusty": {
      "url": "https://mcp.betrusty.io/mcp"
    }
  }
}
```

Reiniciar Claude Desktop. Las herramientas aparecerán disponibles automáticamente.

### Cursor

En `Settings > MCP > Add Server`:

```json
{
  "mcpServers": {
    "betrusty": {
      "url": "https://mcp.betrusty.io/mcp"
    }
  }
}
```

### Cualquier otro cliente MCP

```
POST https://mcp.betrusty.io/mcp
Content-Type: application/json
```

El servidor acepta mensajes JSON-RPC 2.0 estándar. **SSE no está soportado** — el cliente debe operar en modo HTTP POST.

---

## Herramientas disponibles

### `get_pricing`

Calcula el precio de una estadía en una propiedad.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `propertyId` | `string` | Sí | ID de la propiedad en BeTrusty |
| `checkIn` | `string` | Sí | Fecha de entrada (`YYYY-MM-DD`) |
| `checkOut` | `string` | Sí | Fecha de salida (`YYYY-MM-DD`) |
| `roomId` | `string` | No | ID de habitación. Omitir o usar `"null"` para reservar la propiedad completa |

Devuelve: precio total, desglose por noche, moneda, descuentos aplicados y cuotas.

---

### `get_unavailable_properties`

Devuelve los IDs de propiedades sin disponibilidad para un rango de fechas.

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `checkIn` | `string` | Sí | Fecha de entrada (`YYYY-MM-DD`) |
| `checkOut` | `string` | Sí | Fecha de salida (`YYYY-MM-DD`) |

Devuelve: lista de IDs de propiedades no disponibles.

---

## Verificar que funciona

```bash
curl https://mcp.betrusty.io/health
```

Respuesta esperada:

```json
{ "status": "ok" }
```
