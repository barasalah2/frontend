import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface EnhancedWorkPackageTableProps {
  data: any[];
}

type SortDirection = "asc" | "desc" | null;

export function EnhancedWorkPackageTable({ data }: EnhancedWorkPackageTableProps) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterField, setFilterField] = useState<string>("all");
  const [filterValue, setFilterValue] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Get unique values for filter dropdown
  const getUniqueValues = (field: string) => {
    if (!data || field === "all") return [];
    const values = [...new Set(data.map(row => row[field]))].filter(Boolean);
    return values.sort();
  };

  const filteredAndSortedData = useMemo(() => {
    if (!data) return [];

    let filtered = [...data];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filter
    if (filterField !== "all" && filterValue !== "all") {
      filtered = filtered.filter(row => 
        String(row[filterField]).toLowerCase() === filterValue.toLowerCase()
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue === bValue) return 0;

        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, filterField, filterValue, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterField("all");
    setFilterValue("all");
    setSortField(null);
    setSortDirection(null);
  };

  const hasActiveFilters = searchTerm || filterField !== "all" || filterValue !== "all" || sortField;

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No work package data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search all columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
        
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Column</label>
              <Select value={filterField} onValueChange={setFilterField}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Columns</SelectItem>
                  {columns.map(column => (
                    <SelectItem key={column} value={column}>{column}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {filterField !== "all" && (
              <div>
                <label className="block text-sm font-medium mb-2">Filter Value</label>
                <Select value={filterValue} onValueChange={setFilterValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Values</SelectItem>
                    {getUniqueValues(filterField).map(value => (
                      <SelectItem key={String(value)} value={String(value)}>
                        {String(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredAndSortedData.length} of {data.length} records
        {hasActiveFilters && " (filtered)"}
      </div>

      {/* Table Container with Scroll */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-auto max-h-96 table-scroll">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    onClick={() => handleSort(column)}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none border-r border-gray-200 dark:border-gray-600 last:border-r-0"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column}</span>
                      {getSortIcon(column)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedData.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={column}
                      className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600 last:border-r-0"
                    >
                      <div className="max-w-xs truncate" title={String(row[column])}>
                        {row[column]}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSortedData.length === 0 && data.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No records match your current filters
        </div>
      )}
    </div>
  );
}