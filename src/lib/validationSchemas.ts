import { z } from 'zod';

// Quote request validation schema
export const quoteRequestSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(3, 'Subject must be at least 3 characters')
    .max(200, 'Subject must be less than 200 characters'),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(5000, 'Message must be less than 5000 characters'),
});

// Quote request with product validation schema
export const productQuoteRequestSchema = z.object({
  product_id: z.string().uuid('Invalid product ID').optional(),
  quantity: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(10000, 'Quantity cannot exceed 10,000'),
  product_specifications: z
    .string()
    .max(2000, 'Specifications must be less than 2000 characters')
    .optional()
    .nullable(),
  message: z
    .string()
    .max(5000, 'Message must be less than 5000 characters')
    .optional(),
  customSpecs: z
    .string()
    .max(2000, 'Custom specifications must be less than 2000 characters')
    .optional(),
});

// Validate quote request from dashboard
export const validateDashboardQuote = (data: { subject: string; message: string }) => {
  return quoteRequestSchema.safeParse(data);
};

// Validate product quote request
export const validateProductQuote = (data: {
  product_id?: string;
  quantity: number;
  product_specifications?: string | null;
  message?: string;
}) => {
  return productQuoteRequestSchema.safeParse(data);
};

// Validate cart item
export const cartItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(10000),
  customSpecs: z.string().max(2000).optional(),
});

// Validate entire cart
export const validateCart = (items: Array<{ id: string; name: string; quantity: number; customSpecs?: string }>) => {
  const cartSchema = z.array(cartItemSchema).min(1, 'Cart cannot be empty').max(50, 'Cart cannot have more than 50 items');
  return cartSchema.safeParse(items);
};

// Helper to get first error message
export const getValidationError = (result: z.SafeParseError<any>): string => {
  const firstError = result.error.errors[0];
  return firstError?.message || 'Validation failed';
};
