export const mapProducts = (products: any[]) => {
  return products.map((product) => ({
    productId: product.id,
    imageUrl: product.image_url,
    name: product.name,
    price: product.price,
    code: product.code,
    created_at: product.created_at,
    updated_at: product.updated_at,
  }));
};
