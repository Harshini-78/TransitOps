import * as React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "./button";

interface PaginationProps {
  pageIndex: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
  canPreviousPage: boolean;
  canNextPage: boolean;
  previousPage: () => void;
  nextPage: () => void;
  setPageIndex: (index: number) => void;
}

export function Pagination({
  pageIndex,
  pageCount,
  pageSize,
  totalCount,
  canPreviousPage,
  canNextPage,
  previousPage,
  nextPage,
  setPageIndex,
}: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-2 py-4 border-t">
      {/* Total records summary */}
      <div className="flex-1 text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium">
          {totalCount === 0 ? 0 : pageIndex * pageSize + 1}
        </span>{" "}
        to{" "}
        <span className="font-medium">
          {Math.min((pageIndex + 1) * pageSize, totalCount)}
        </span>{" "}
        of <span className="font-medium">{totalCount}</span> entries
      </div>
      
      {/* Navigation Buttons */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          className="hidden h-8 w-8 p-0 lg:flex"
          onClick={() => setPageIndex(0)}
          disabled={!canPreviousPage}
        >
          <span className="sr-only">Go to first page</span>
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={previousPage}
          disabled={!canPreviousPage}
        >
          <span className="sr-only">Go to previous page</span>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {/* Page status label */}
        <span className="text-sm font-medium">
          Page {pageCount === 0 ? 0 : pageIndex + 1} of {pageCount}
        </span>
        
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={nextPage}
          disabled={!canNextPage}
        >
          <span className="sr-only">Go to next page</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="hidden h-8 w-8 p-0 lg:flex"
          onClick={() => setPageIndex(pageCount - 1)}
          disabled={!canNextPage}
        >
          <span className="sr-only">Go to last page</span>
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
