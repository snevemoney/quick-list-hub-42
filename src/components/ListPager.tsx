import { Button } from "@/components/ui/button";

export function ListPager({
  page,
  hasMore,
  disabled,
  onPrev,
  onNext,
}: {
  page: number;
  hasMore: boolean;
  disabled?: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  if (page === 0 && !hasMore) return null;
  return (
    <div className="flex justify-center gap-2 mt-6">
      <Button type="button" variant="outline" size="sm" disabled={page === 0 || disabled} onClick={onPrev}>
        Previous
      </Button>
      <span className="text-sm text-muted-foreground self-center">Page {page + 1}</span>
      <Button type="button" variant="outline" size="sm" disabled={!hasMore || disabled} onClick={onNext}>
        Next
      </Button>
    </div>
  );
}
