import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/admin/image-upload";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  adminCategoriesQueryOptions,
  saveProduct,
  slugify,
  type ProductFormInput,
} from "@/lib/admin-queries";

import type { Product } from "@/lib/queries";

const variationSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Required"),
  sku: z.string().optional(),
  price: z.coerce.number().min(0, "Must be 0 or more"),
  stock: z.coerce.number().int("Whole numbers only").min(0, "Must be 0 or more"),
  is_available: z.boolean(),
  image_url: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),

  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),

  categoryId: z.string().optional(),

  description: z.string().optional(),

  warranty: z.string().optional(),

  brand: z.string().optional(),

  videoUrl: z.string().optional(),

  imageUrl: z.string().optional(),

  isFeatured: z.boolean(),

  isAvailable: z.boolean(),

  variations: z.array(variationSchema).min(1, "Add at least one variation"),
});

type ProductFormValues = z.infer<typeof productSchema>;

type SpecRow = {
  key: string;
  value: string;
};

function specsToRows(specs: Record<string, unknown>): SpecRow[] {
  const rows = Object.entries(specs).map(([key, value]) => ({
    key,
    value: String(value),
  }));

  return rows.length > 0 ? rows : [{ key: "", value: "" }];
}

/**
 * Builds a category list for the product dropdown.
 *
 * This does not depend on flattenCategoryTree(), so the dropdown
 * still works even if parent_id is null, undefined, or an empty string.
 */
function buildCategoryOptions(categories: any[]) {
  if (!categories || categories.length === 0) {
    return [];
  }

  const result: {
    category: any;
    depth: number;
  }[] = [];

  const visited = new Set<string>();

  const visit = (parentId: string | null, depth: number) => {
    const children = categories
      .filter((category) => {
        const categoryParent =
          category.parent_id === undefined ||
          category.parent_id === null ||
          category.parent_id === ""
            ? null
            : category.parent_id;

        return categoryParent === parentId;
      })
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));

    for (const category of children) {
      if (!category?.id || visited.has(category.id)) {
        continue;
      }

      visited.add(category.id);

      result.push({
        category,
        depth,
      });

      visit(category.id, depth + 1);
    }
  };

  // First try the normal tree.
  visit(null, 0);

  /**
   * Safety fallback:
   *
   * If the database contains unexpected parent_id values,
   * don't leave the dropdown completely empty.
   */
  if (result.length === 0) {
    return [...categories]
      .filter((category) => category?.id)
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
      .map((category) => ({
        category,
        depth: 0,
      }));
  }

  /**
   * If some categories were not reached through the tree,
   * append them so they are still selectable.
   */
  for (const category of categories) {
    if (!category?.id || visited.has(category.id)) {
      continue;
    }

    result.push({
      category,
      depth: 0,
    });
  }

  return result;
}

export function ProductForm({ product }: { product?: Product }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: categories,
    isLoading: categoriesLoading,
    isError: categoriesError,
    error: categoriesQueryError,
  } = useQuery(adminCategoriesQueryOptions());

  /**
   * Convert the categories returned by React Query into
   * dropdown options.
   */
  const categoryOptions = useMemo(() => buildCategoryOptions(categories ?? []), [categories]);

  const [specs, setSpecs] = useState<SpecRow[]>(
    specsToRows((product?.specs as Record<string, unknown>) ?? {}),
  );

  const [slugEdited, setSlugEdited] = useState(Boolean(product));

  const [gallery, setGallery] = useState<string[]>(
    [...(product?.product_images ?? [])]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => image.url),
  );

  const defaultVariations: ProductFormValues["variations"] =
    product && product.product_variations.length > 0
      ? product.product_variations.map((v): ProductFormValues["variations"][number] => ({
          id: v.id,
          name: v.name,
          sku: v.sku ?? "",
          price: v.price,
          stock: v.stock,
          is_available: v.is_available,
          image_url: v.image_url ?? "",
        }))
      : [
          {
            name: "",
            sku: "",
            price: 0,
            stock: 0,
            is_available: true,
            image_url: "",
          },
        ];

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),

    defaultValues: {
      name: product?.name ?? "",
      slug: product?.slug ?? "",
      categoryId: product?.category_id ?? undefined,
      description: product?.description ?? "",
      warranty: product?.warranty ?? "",
      brand: product?.brand ?? "",
      videoUrl: product?.video_url ?? "",
      imageUrl: product?.image_url ?? "",
      isFeatured: product?.is_featured ?? false,
      isAvailable: product?.is_available ?? true,
      variations: defaultVariations as ProductFormValues["variations"],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "variations",
  });

  const mutation = useMutation({
    mutationFn: (values: ProductFormValues) => {
      const input: ProductFormInput = {
        ...(product?.id
          ? {
              id: product.id,
            }
          : {}),

        name: values.name,

        slug: values.slug,

        categoryId: values.categoryId ?? null,

        description: values.description ?? "",

        warranty: values.warranty ?? "",

        brand: values.brand ?? "",

        videoUrl: values.videoUrl ?? "",

        imageUrl: values.imageUrl ?? "",

        isFeatured: values.isFeatured,

        isAvailable: values.isAvailable,

        specs: Object.fromEntries(
          specs.filter((row) => row.key.trim()).map((row) => [row.key.trim(), row.value]),
        ),

        variations: values.variations.map((v) => ({
          ...(v.id
            ? {
                id: v.id,
              }
            : {}),

          name: v.name,

          sku: v.sku ?? "",

          price: v.price,

          stock: v.stock,

          is_available: v.is_available,

          image_url: v.image_url ?? "",
        })),

        gallery: gallery.filter((url) => url.trim()),
      };

      return saveProduct(input);
    },

    onSuccess: () => {
      toast.success(product ? "Product updated" : "Product created");

      void queryClient.invalidateQueries({
        queryKey: ["admin", "products"],
      });

      void queryClient.invalidateQueries({
        queryKey: ["products"],
      });

      void queryClient.invalidateQueries({
        queryKey: ["admin", "dashboard"],
      });

      void navigate({
        to: "/admin/products",
      });
    },

    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateSpecRow = (index: number, patch: Partial<SpecRow>) => {
    setSpecs((rows) =>
      rows.map((row, i) =>
        i === index
          ? {
              ...row,
              ...patch,
            }
          : row,
      ),
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((values) => mutation.mutate(values))} className="space-y-6">
        {/* ============================= */}
        {/* DETAILS */}
        {/* ============================= */}

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h2 className="font-display text-base font-semibold text-foreground">Details</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>

                  <FormControl>
                    <Input
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);

                        if (!slugEdited) {
                          form.setValue("slug", slugify(event.target.value));
                        }
                      }}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug (URL)</FormLabel>

                  <FormControl>
                    <Input
                      {...field}
                      onChange={(event) => {
                        setSlugEdited(true);
                        field.onChange(event);
                      }}
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* ============================= */}
          {/* CATEGORY */}
          {/* ============================= */}

          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Category</FormLabel>

                <Select
                  value={field.value ?? ""}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>

                  <SelectContent>
                    {categoriesLoading && (
                      <SelectItem value="loading" disabled>
                        Loading categories...
                      </SelectItem>
                    )}

                    {categoriesError && (
                      <SelectItem value="error" disabled>
                        Failed to load categories
                      </SelectItem>
                    )}

                    {!categoriesLoading && !categoriesError && categoryOptions.length === 0 && (
                      <SelectItem value="empty" disabled>
                        No categories found
                      </SelectItem>
                    )}

                    {!categoriesLoading &&
                      !categoriesError &&
                      categoryOptions.map(({ category, depth }) => (
                        <SelectItem key={category.id} value={category.id}>
                          <span>
                            {"\u00A0\u00A0".repeat(depth)}

                            {depth > 0 ? "– " : ""}

                            {category.name}
                          </span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {categoriesQueryError && (
                  <p className="text-xs text-destructive">
                    {categoriesQueryError instanceof Error
                      ? categoriesQueryError.message
                      : "Unable to load categories."}
                  </p>
                )}

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Description</FormLabel>

                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Main image</FormLabel>

                  <FormControl>
                    <ImageUpload
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      folder="products"
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand / manufacturer (optional)</FormLabel>

                  <FormControl>
                    <Input {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="videoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Showcase video (optional, MP4, under 10 MB)</FormLabel>

                  <FormControl>
                    <ImageUpload
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      folder="products"
                      accept="video/mp4,video/webm"
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="warranty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warranty (optional)</FormLabel>

                  <FormControl>
                    <Input placeholder="12 months" {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-6">
            <FormField
              control={form.control}
              name="isFeatured"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>

                  <FormLabel className="!mt-0">Featured on homepage</FormLabel>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isAvailable"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>

                  <FormLabel className="!mt-0">Published (visible in shop)</FormLabel>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ============================= */}
        {/* GALLERY */}
        {/* ============================= */}

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-foreground">
              Extra gallery images
            </h2>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setGallery((urls) => [...urls, ""])}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add image
            </Button>
          </div>

          <div className="mt-3 space-y-3">
            {gallery.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Optional. The main image above is always shown first.
              </p>
            )}

            {gallery.map((url, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className="flex-1">
                  <ImageUpload
                    value={url}
                    folder="products"
                    onChange={(next) =>
                      setGallery((urls) => urls.map((u, i) => (i === index ? next : u)))
                    }
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove image"
                  onClick={() => setGallery((urls) => urls.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* ============================= */}
        {/* SPECIFICATIONS */}
        {/* ============================= */}

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-foreground">Specifications</h2>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                setSpecs((rows) => [
                  ...rows,
                  {
                    key: "",
                    value: "",
                  },
                ])
              }
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add spec
            </Button>
          </div>

          <div className="mt-3 space-y-2">
            {specs.map((row, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Attribute (e.g. wattage)"
                  value={row.key}
                  onChange={(event) =>
                    updateSpecRow(index, {
                      key: event.target.value,
                    })
                  }
                />

                <Input
                  placeholder="Value (e.g. 550W)"
                  value={row.value}
                  onChange={(event) =>
                    updateSpecRow(index, {
                      value: event.target.value,
                    })
                  }
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove spec"
                  onClick={() => setSpecs((rows) => rows.filter((_, i) => i !== index))}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* ============================= */}
        {/* VARIATIONS */}
        {/* ============================= */}

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-foreground">Variations</h2>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() =>
                append({
                  name: "",
                  sku: "",
                  price: 0,
                  stock: 0,
                  is_available: true,
                  image_url: "",
                })
              }
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add variation
            </Button>
          </div>

          {form.formState.errors.variations?.message && (
            <p className="mt-2 text-sm text-destructive">
              {form.formState.errors.variations.message}
            </p>
          )}

          <div className="mt-3 space-y-3">
            {fields.map((fieldItem, index) => (
              <div
                key={fieldItem.id}
                className="grid gap-2 rounded-xl border border-border p-3 sm:grid-cols-12 sm:items-end"
              >
                <FormField
                  control={form.control}
                  name={`variations.${index}.name`}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel className="text-xs">Name</FormLabel>

                      <FormControl>
                        <Input placeholder="e.g. 4 Gang" {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`variations.${index}.sku`}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-xs">SKU (optional)</FormLabel>

                      <FormControl>
                        <Input {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`variations.${index}.price`}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-xs">Price (₦)</FormLabel>

                      <FormControl>
                        <Input type="number" min={0} step="1" {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`variations.${index}.stock`}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-xs">Stock</FormLabel>

                      <FormControl>
                        <Input type="number" min={0} step="1" {...field} />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`variations.${index}.is_available`}
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0 sm:col-span-2">
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>

                      <FormLabel className="!mt-0 text-xs">Available</FormLabel>
                    </FormItem>
                  )}
                />

                <div className="sm:col-span-1 sm:justify-self-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove variation"
                    disabled={fields.length === 1}
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>

                <FormField
                  control={form.control}
                  name={`variations.${index}.image_url`}
                  render={({ field }) => (
                    <FormItem className="sm:col-span-12">
                      <FormLabel className="text-xs">Variation image (optional)</FormLabel>

                      <FormControl>
                        <ImageUpload
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          folder="variations"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        {/* ============================= */}
        {/* SUBMIT */}
        {/* ============================= */}

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            variant="brand"
            className="rounded-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}

            {product ? "Save changes" : "Create product"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
