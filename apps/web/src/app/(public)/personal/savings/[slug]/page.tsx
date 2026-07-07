import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SavingsProductDetail } from '@/components/public/savings-product-detail';
import { SITE, SAVINGS_PRODUCTS, getSavingsProduct } from '@/lib/site-content';

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return SAVINGS_PRODUCTS.map((product) => ({ slug: product.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const product = getSavingsProduct(params.slug);
  if (!product) return { title: `Savings | ${SITE.name}` };

  return {
    title: `${product.name} | ${SITE.name}`,
    description: product.description,
  };
}

export default function SavingsProductPage({ params }: Props) {
  const product = getSavingsProduct(params.slug);
  if (!product) notFound();

  const otherProduct = SAVINGS_PRODUCTS.find((p) => p.slug !== params.slug);

  return <SavingsProductDetail product={product} otherProduct={otherProduct} />;
}
