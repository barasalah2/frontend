import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface WorkPackageTableProps {
  data: any[];
}

type SortDirection = "asc" | "desc" | null;

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "in progress":
      return "bg-workpack-green text-white";
    case "planned":
      return "bg-workpack-orange text-white";
    case "delayed":
      return "bg-red-500 text-white";
    case "completed":
      return "bg-blue-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
};

export function WorkPackageTable({ data }: WorkPackageTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="workpack-slate dark:text-slate-400">No work package data available</p>
      </div>
    );
  }

  const headers = Object.keys(data[0]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortColumn(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn || !sortDirection) return 0;

    const aVal = a[sortColumn];
    const bVal = b[sortColumn];

    if (sortDirection === "asc") {
      return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
    } else {
      return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
    }
  });

  const getSortIcon = (column: string) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-3 w-3" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-3 w-3" />;
    }
    if (sortDirection === "desc") {
      return <ArrowDown className="h-3 w-3" />;
    }
    return <ArrowUpDown className="h-3 w-3" />;
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header} className="font-medium workpack-slate dark:text-slate-400">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort(header)}
                  className="h-auto p-0 font-medium hover:bg-transparent"
                >
                  {header}
                  <span className="ml-1">
                    {getSortIcon(header)}
                  </span>
                </Button>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((row, index) => (
            <TableRow 
              key={index} 
              className="hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              {headers.map((header) => {
                const value = row[header];
                
                return (
                  <TableCell key={header} className="workpack-text dark:text-slate-200">
                    {header.toLowerCase().includes("wp id") ? (
                      <span className="font-mono text-workpack-blue font-medium">{value}</span>
                    ) : header.toLowerCase().includes("status") ? (
                      <Badge className={`${getStatusColor(value)} text-xs font-medium`}>
                        {value}
                      </Badge>
                    ) : header.toLowerCase().includes("progress") ? (
                      <div className="flex items-center space-x-2">
                        <Progress 
                          value={parseInt(value) || 0} 
                          className="w-16 h-2"
                        />
                        <span className="text-xs font-medium min-w-[2rem]">{value}</span>
                      </div>
                    ) : (
                      value
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
