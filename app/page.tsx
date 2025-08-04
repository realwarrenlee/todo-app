"use client"

import * as React from "react"
import { Plus, Trash2, Check, Folder, Home, Moon, Sun, Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useTheme } from "next-themes"

interface Todo {
  todoId: string
  task: string
  completed: boolean
  categoryId: string
  created: string
}

interface Category {
  categoryId: string
  name: string
  color: string
}

const allTasksCategory: Category = { categoryId: "all", name: "All Tasks", color: "bg-gray-500" }

export default function TodoApp() {
  const [todos, setTodos] = React.useState<Todo[]>([])
  const [categories, setCategories] = React.useState<Category[]>([allTasksCategory])
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("all")
  const [newTodo, setNewTodo] = React.useState("")
  const [newCategoryName, setNewCategoryName] = React.useState("")
  const [isAddCategoryOpen, setIsAddCategoryOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [sortBy, setSortBy] = React.useState("created")
  const [sortOrder, setSortOrder] = React.useState("desc")
  const [currentPage, setCurrentPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalItems, setTotalItems] = React.useState(0)
  const itemsPerPage = 10

  const { theme, setTheme } = useTheme()

  // Load data from API on mount and when filters change
  React.useEffect(() => {
    const loadData = async () => {
      try {
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: itemsPerPage.toString(),
          sortBy,
          sortOrder,
          ...(searchQuery && { search: searchQuery }),
          ...(selectedCategoryId !== 'all' && { categoryId: selectedCategoryId })
        })

        const [todosResponse, categoriesResponse] = await Promise.all([
          fetch(`/api/todos?${params}`),
          fetch("/api/categories"),
        ])

        if (todosResponse.ok) {
          const todosData = await todosResponse.json()
          if (todosData.items) {
            setTodos(todosData.items)
            setTotalPages(todosData.pagination.totalPages)
            setTotalItems(todosData.pagination.total)
          } else {
            // Fallback for old API format
            setTodos(todosData)
          }
        }

        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json()
          setCategories([allTasksCategory, ...categoriesData])
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [currentPage, sortBy, sortOrder, searchQuery, selectedCategoryId])

  const addTodo = async () => {
    if (!newTodo.trim()) return

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          task: newTodo.trim(),
          categoryId: selectedCategoryId === "all" ? "personal" : selectedCategoryId,
        }),
      })

      if (response.ok) {
        const todo = await response.json()
        setTodos([...todos, todo])
        setNewTodo("")
      }
    } catch (error) {
      console.error("Error adding todo:", error)
    }
  }

  const toggleTodo = async (todoId: string) => {
    const todo = todos.find((t) => t.todoId === todoId)
    if (!todo) return

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          completed: !todo.completed,
        }),
      })

      if (response.ok) {
        const updatedTodo = await response.json()
        setTodos(todos.map((t) => (t.todoId === todoId ? updatedTodo : t)))
      }
    } catch (error) {
      console.error("Error toggling todo:", error)
    }
  }

  const deleteTodo = async (todoId: string) => {
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setTodos(todos.filter((todo) => todo.todoId !== todoId))
      }
    } catch (error) {
      console.error("Error deleting todo:", error)
    }
  }

  const addCategory = async () => {
    if (!newCategoryName.trim()) return

    const colors = ["bg-red-500", "bg-yellow-500", "bg-indigo-500", "bg-pink-500", "bg-teal-500"]
    const randomColor = colors[Math.floor(Math.random() * colors.length)]

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          color: randomColor,
        }),
      })

      if (response.ok) {
        const category = await response.json()
        setCategories([...categories, category])
        setNewCategoryName("")
        setIsAddCategoryOpen(false)
      }
    } catch (error) {
      console.error("Error adding category:", error)
    }
  }

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setCategories(categories.filter((cat) => cat.categoryId !== categoryId))
        setTodos(todos.filter((todo) => todo.categoryId !== categoryId))
        if (selectedCategoryId === categoryId) {
          setSelectedCategoryId("all")
        }
      }
    } catch (error) {
      console.error("Error deleting category:", error)
    }
  }

  const selectedCategory = categories.find((cat) => cat.categoryId === selectedCategoryId)
  const completedCount = todos.filter((todo) => todo.completed).length
  const totalCount = todos.length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 py-1">
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-500 text-white">
              <Check className="size-4" />
            </div>
            <div className="flex flex-col gap-0.5 leading-none">
              <span className="font-semibold">Todo App</span>
              <span className="text-xs text-sidebar-foreground/70">Stay organized</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Categories</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {categories.map((category) => {
                  // Only show count for "All Tasks" category
                  const count = category.categoryId === "all" ? todos.length : 0

                  return (
                    <SidebarMenuItem key={category.categoryId}>
                      <SidebarMenuButton
                        onClick={() => setSelectedCategoryId(category.categoryId)}
                        isActive={selectedCategoryId === category.categoryId}
                        className="w-full justify-between"
                      >
                        <div className="flex items-center gap-2">
                          {category.categoryId === "all" ? (
                            <Home className="size-4" />
                          ) : (
                            <div className={cn("size-3 rounded-full", category.color)} />
                          )}
                          <span>{category.name}</span>
                        </div>
                        {count > 0 && <span className="text-xs text-sidebar-foreground/70">{count}</span>}
                      </SidebarMenuButton>
                      {category.categoryId !== "all" && ( // Only show delete for non-"All Tasks" categories
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1.5 size-6 p-0 text-muted-foreground hover:text-destructive"
                              aria-label={`Delete ${category.name} category`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the{" "}
                                <span className="font-semibold">{category.name}</span> category and all associated
                                tasks.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteCategory(category.categoryId)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupContent>
              <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                    <Plus className="size-4 mr-2" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Enter category name"
                      onKeyDown={(e) => e.key === "Enter" && addCategory()}
                    />
                    <Button onClick={addCategory} className="w-full">
                      Add Category
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2">
            {selectedCategory?.categoryId === "all" ? (
              <Home className="size-4" />
            ) : (
              <div className={cn("size-3 rounded-full", selectedCategory?.color)} />
            )}
            <h1 className="font-semibold">{selectedCategory?.name}</h1>
            {totalCount > 0 && (
              <span className="text-sm text-muted-foreground">
                {completedCount}/{totalCount} completed
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="ml-auto size-8 p-0"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="flex gap-2">
            <Input
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="Add a new task..."
              onKeyDown={(e) => e.key === "Enter" && addTodo()}
              className="flex-1"
            />
            <Button onClick={addTodo}>
              <Plus className="size-4" />
            </Button>
          </div>

          {/* Search and Sort Controls */}
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                placeholder="Search tasks..."
                className="pl-10"
              />
            </div>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Date</SelectItem>
                <SelectItem value="task">Name</SelectItem>
                <SelectItem value="completed">Status</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="size-4" />
              {sortOrder === 'asc' ? 'Asc' : 'Desc'}
            </Button>
          </div>

          <div className="space-y-2">
            {todos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="size-12 mx-auto mb-2 opacity-50" />
                <p>No tasks yet. Add one above!</p>
              </div>
            ) : (
              todos.map((todo) => (
                <div
                  key={todo.todoId}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border bg-card",
                    todo.completed && "opacity-60",
                  )}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleTodo(todo.todoId)}
                    className={cn(
                      "size-6 p-0 rounded-full border-2",
                      todo.completed
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground/30",
                    )}
                  >
                    {todo.completed && <Check className="size-3" />}
                  </Button>

                  <span className={cn("flex-1 text-sm", todo.completed && "line-through text-muted-foreground")}>
                    {todo.task}
                  </span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTodo(todo.todoId)}
                    className="size-8 p-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} tasks
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="size-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
