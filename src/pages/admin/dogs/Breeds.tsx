import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Plus, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Breed {
  id: string;
  breed: string;
  origin: string | null;
  temperament: string | null;
  exercise_needs: string | null;
  grooming_needs: string | null;
  life_span_years: string | null;
  fci_group: number | null;
}

export default function AdminBreeds() {
  const [breeds, setBreeds] = useState<Breed[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    loadBreeds();
  }, [currentPage, searchTerm]);

  const loadBreeds = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("dog_breeds")
        .select("id, breed, origin, temperament, exercise_needs, grooming_needs, life_span_years, fci_group", { count: "exact" })
        .order("breed", { ascending: true })
        .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      if (searchTerm) {
        query = query.ilike("breed", `%${searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setBreeds(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error("Error loading breeds:", error);
      toast.error("Failed to load breeds");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dog Breeds</h1>
          <p className="text-muted-foreground">Manage breed information and characteristics</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Breed
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Breeds Database</CardTitle>
          <CardDescription>Browse and manage dog breed information</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search breeds..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Breed Name</TableHead>
                <TableHead>Origin</TableHead>
                <TableHead>FCI Group</TableHead>
                <TableHead>Exercise Needs</TableHead>
                <TableHead>Grooming</TableHead>
                <TableHead>Life Span</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading breeds...
                  </TableCell>
                </TableRow>
              ) : breeds.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No breeds found
                  </TableCell>
                </TableRow>
              ) : (
                breeds.map((breed) => (
                  <TableRow key={breed.id}>
                    <TableCell className="font-medium">{breed.breed}</TableCell>
                    <TableCell className="text-muted-foreground">{breed.origin || "-"}</TableCell>
                    <TableCell>
                      {breed.fci_group ? (
                        <Badge variant="outline">Group {breed.fci_group}</Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {breed.exercise_needs || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {breed.grooming_needs || "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {breed.life_span_years || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, totalCount)} of {totalCount} breeds
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
