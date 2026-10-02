import type { Category } from "@/lib/queries";

/**
 * Returns all top-level categories.
 *
 * A root category normally has parent_id = null.
 * We also handle undefined or an empty string defensively so that
 * categories are not accidentally hidden if the value comes from
 * another data source in a slightly different form.
 */
export function getRootCategories(categories: Category[]): Category[] {
  return categories
    .filter(
      (category) =>
        category.parent_id === null ||
        category.parent_id === undefined ||
        category.parent_id === "",
    )
    .sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Returns all categories whose parent is the given category.
 *
 * Results are sorted using the category's sort_order.
 */
export function getChildren(categories: Category[], parentId: string): Category[] {
  return categories
    .filter((category) => category.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Returns the given category ID plus every descendant category ID.
 *
 * Example:
 *
 * Lighting
 *   └── Indoor Lighting
 *       └── Ceiling Lights
 *
 * Calling:
 *
 * getDescendantIds(categories, lightingId)
 *
 * returns:
 *
 * [
 *   lightingId,
 *   indoorLightingId,
 *   ceilingLightsId
 * ]
 *
 * A Set is used to prevent infinite loops if corrupt/cyclic category
 * relationships exist.
 */
export function getDescendantIds(categories: Category[], rootId: string): string[] {
  const ids: string[] = [rootId];

  const seen = new Set<string>([rootId]);

  let frontier: string[] = [rootId];

  while (frontier.length > 0) {
    const next: string[] = [];

    for (const parentId of frontier) {
      const children = getChildren(categories, parentId);

      for (const child of children) {
        if (seen.has(child.id)) {
          continue;
        }

        seen.add(child.id);
        ids.push(child.id);
        next.push(child.id);
      }
    }

    frontier = next;
  }

  return ids;
}

/**
 * Returns the ancestor chain for a category.
 *
 * The result starts with the root category and ends with the direct
 * parent of the supplied category.
 *
 * The supplied category itself is not included.
 *
 * Example:
 *
 * Lighting
 *   └── Indoor Lighting
 *       └── Ceiling Lights
 *
 * For Ceiling Lights, this returns:
 *
 * [
 *   Lighting,
 *   Indoor Lighting
 * ]
 *
 * Cyclic/corrupt parent relationships are protected against with a Set.
 */
export function getAncestors(categories: Category[], categoryId: string): Category[] {
  const byId = new Map<string, Category>(categories.map((category) => [category.id, category]));

  const chain: Category[] = [];

  const seen = new Set<string>();

  let current = byId.get(categoryId);

  while (current?.parent_id) {
    const parentId = current.parent_id;

    if (seen.has(parentId)) {
      break;
    }

    seen.add(parentId);

    const parent = byId.get(parentId);

    if (!parent) {
      break;
    }

    chain.unshift(parent);

    current = parent;
  }

  return chain;
}

/**
 * Flattens the category hierarchy into a root-first list.
 *
 * Each result contains:
 *
 * {
 *   category,
 *   depth
 * }
 *
 * depth 0 = root category
 * depth 1 = child category
 * depth 2 = grandchild category
 *
 * This is useful for:
 *
 * - Admin category lists
 * - Category dropdowns
 * - Indented select options
 * - Category trees
 */
export function flattenCategoryTree(
  categories: Category[],
): { category: Category; depth: number }[] {
  const result: { category: Category; depth: number }[] = [];

  const seen = new Set<string>();

  const visit = (parentId: string | null, depth: number): void => {
    const level = categories
      .filter((category) => {
        if (parentId === null) {
          return (
            category.parent_id === null ||
            category.parent_id === undefined ||
            category.parent_id === ""
          );
        }

        return category.parent_id === parentId;
      })
      .sort((a, b) => a.sort_order - b.sort_order);

    for (const category of level) {
      if (seen.has(category.id)) {
        continue;
      }

      seen.add(category.id);

      result.push({
        category,
        depth,
      });

      visit(category.id, depth + 1);
    }
  };

  visit(null, 0);

  return result;
}

/**
 * Returns the top-level/root category for a given category.
 *
 * If the supplied category is already a root category, that category
 * itself is returned.
 *
 * Returns undefined if the category cannot be found.
 */
export function getRootOf(categories: Category[], categoryId: string): Category | undefined {
  const byId = new Map<string, Category>(categories.map((category) => [category.id, category]));

  const ancestors = getAncestors(categories, categoryId);

  return ancestors[0] ?? byId.get(categoryId);
}
