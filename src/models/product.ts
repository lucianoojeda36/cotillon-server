export interface Product {
  id: number; // ID del producto (auto-incremental, clave primaria)
  name: string; // Nombre del producto
  price: number; // Precio del producto (como número decimal)
  image_url: string; // URL de la imagen del producto
  code: string; // Código del producto
  created_at: string; // Fecha de creación del producto (en formato ISO 8601)
  updated_at: string; // Fecha de la última actualización del producto (en formato ISO 8601)
}
