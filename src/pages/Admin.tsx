import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PageHeader } from "@/components/layout/PageHeader";
import { AdminVerification } from "@/components/admin/AdminVerification";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Users,
  FileText,
  Package,
  Plus,
  Edit,
  Trash2,
  Mail,
  Save,
  Flame,
  MessageCircle,
  Download,
  FileSpreadsheet,
  FileDown,
  UserPlus,
  LayoutDashboard,
  ChevronDown,
  Tag,
  X,
  Hash,
  Grid3x3,
  Menu,
  ChevronRight,
  MoreVertical,
  Eye,
  Crown,
  BadgeCheck,
  Star,
  Settings,
  Database,
  Calendar as CalendarIcon,
  DollarSign,
  Image as ImageIcon,
  Calendar,
  Search,
  Filter,
  Info,
  UserX,
  Ban,
} from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { AboutBannerUploader } from "@/components/admin/AboutBannerUploader";
import { format } from "date-fns";
import {
  exportToExcel,
  exportToPDF,
  quoteColumnsWithUser,
  productColumns,
  userColumns,
} from "@/lib/exportUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  joined_at: string;
  role?: string;
  is_disabled?: boolean;
}

interface QuoteRequest {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  user_id: string;
  quantity: number | null;
  product_specifications: string | null;
  product_id: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category: string | null;
  category_id: string | null;
  specifications: string | null;
  is_trending: boolean;
  is_active: boolean;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export default function Admin() {
  const { user, showAdminUI, isSuperAdmin, loading: authLoading } = useAuth();
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isVerified, setIsVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [disablingUser, setDisablingUser] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Product form state
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
    category: "",
    category_id: "",
    specifications: "",
    is_trending: false,
    is_active: true,
  });

  // Category form state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    is_active: true,
    display_order: 0,
  });

  // Profile edit state
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  // Quote edit/delete state
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuoteRequest | null>(null);
  const [quoteForm, setQuoteForm] = useState({
    subject: "",
    message: "",
    status: "pending",
  });
  const [deleteQuoteDialogOpen, setDeleteQuoteDialogOpen] = useState(false);
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);
  const [savingQuote, setSavingQuote] = useState(false);

  // User disable dialog
  const [disableUserDialogOpen, setDisableUserDialogOpen] = useState(false);
  const [disablingUserId, setDisablingUserId] = useState<string | null>(null);

  // User delete dialog
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [deletingUserName, setDeletingUserName] = useState<string>("");

  // Search and filter states
  const [quoteSearch, setQuoteSearch] = useState("");
  const [quoteFilter, setQuoteFilter] = useState("all");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!showAdminUI) {
        navigate("/dashboard");
      } else {
        setCheckingVerification(false);
      }
    }
  }, [user, showAdminUI, authLoading, navigate]);

  useEffect(() => {
    if (user && showAdminUI && isVerified) {
      fetchAllData();
    }
  }, [user, showAdminUI, isVerified]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchQuoteRequests(),
      fetchProfilesWithRoles(),
      fetchProducts(),
      fetchCategories(),
    ]);
    setLoading(false);
  };

  const fetchQuoteRequests = async () => {
    const { data, error } = await supabase
      .from("quote_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setQuoteRequests(data);
    }
  };

  const fetchProfilesWithRoles = async () => {
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("joined_at", { ascending: false });

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return;
      }

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
      }

      // Fetch disabled users
      const { data: disabledUsersData } = await supabase
        .from("disabled_users")
        .select("user_id");

      const disabledUserIds = new Set();
      if (disabledUsersData) {
        disabledUsersData.forEach((item) => {
          disabledUserIds.add(item.user_id);
        });
      }

      const rolesMap = new Map();
      if (rolesData) {
        rolesData.forEach((role) => {
          rolesMap.set(role.user_id, role.role);
        });
      }

      const profilesWithRoles = profilesData.map((profile) => ({
        ...profile,
        role: rolesMap.get(profile.user_id) || "user",
        is_disabled: disabledUserIds.has(profile.user_id),
      }));

      setProfiles(profilesWithRoles);
    } catch (error) {
      console.error("Error in fetchProfilesWithRoles:", error);
    }
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        categories:category_id (
          name
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (!error && data) {
      const transformedData = data.map((item) => ({
        ...item,
        category: item.categories?.name || item.category,
        category_id: item.category_id,
      }));
      setProducts(transformedData as Product[]);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (!error && data) {
      setCategories(data as Category[]);
    }
  };

  const getUserProfile = (userId: string) => {
    return profiles.find((p) => p.user_id === userId);
  };

  const getProductName = (productId: string | null) => {
    if (!productId) return null;
    const product = products.find((p) => p.id === productId);
    return product?.name || null;
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || null;
  };

  // Filter quotes based on search and filter
  const filteredQuotes = quoteRequests.filter((quote) => {
    const profile = getUserProfile(quote.user_id);
    const productName = getProductName(quote.product_id);

    // Apply status filter
    if (quoteFilter !== "all" && quote.status !== quoteFilter) {
      return false;
    }

    // Apply search filter
    if (quoteSearch) {
      const searchLower = quoteSearch.toLowerCase();
      return (
        quote.subject.toLowerCase().includes(searchLower) ||
        quote.message.toLowerCase().includes(searchLower) ||
        (profile?.full_name?.toLowerCase().includes(searchLower) ?? false) ||
        (profile?.email?.toLowerCase().includes(searchLower) ?? false) ||
        (productName?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    return true;
  });

  // Filter profiles - for normal admin, hide superadmin and admin, only show users
  const filteredProfiles = isSuperAdmin
    ? profiles
    : profiles.filter((profile) => profile.role === "user");

  const updateStatus = async (
    id: string,
    newStatus: string,
    userEmail: string,
    userPhone: string | null,
    request: QuoteRequest,
  ) => {
    setUpdating(id);

    const { error } = await supabase
      .from("quote_requests")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    } else {
      try {
        await supabase.functions.invoke("send-status-notification", {
          body: {
            quote_request_id: id,
            status: newStatus,
          },
        });

        const notificationMsg = userPhone
          ? "Email and WhatsApp notification sent."
          : "Email notification sent.";

        toast({
          title: "Status updated",
          description: `Request marked as ${newStatus}. ${notificationMsg}`,
        });
      } catch (emailError) {
        console.log("Notification failed:", emailError);
        toast({
          title: "Status updated",
          description: `Request marked as ${newStatus}. Notification failed.`,
        });
      }
      fetchQuoteRequests();
    }

    setUpdating(null);
  };

  const openWhatsApp = (
    phone: string | null,
    status: string,
    productName: string | null,
  ) => {
    if (!phone) {
      toast({
        title: "No phone number",
        description: "This user has not provided a phone number.",
        variant: "destructive",
      });
      return;
    }

    let cleanPhone = phone.replace(/[\s\-\(\)]/g, "");
    if (!cleanPhone.startsWith("+")) {
      if (cleanPhone.startsWith("0")) {
        cleanPhone = cleanPhone.substring(1);
      }
      if (!cleanPhone.startsWith("91")) {
        cleanPhone = "91" + cleanPhone;
      }
    } else {
      cleanPhone = cleanPhone.substring(1);
    }

    let message = "";
    switch (status) {
      case "approved":
        message = `✅ Great News! Your quote request${productName ? ` for ${productName}` : ""} has been APPROVED! Our team will contact you shortly.`;
        break;
      case "rejected":
        message = `❌ Quote Update: Unfortunately, we're unable to proceed with your quote request${productName ? ` for ${productName}` : ""} at this time. Please contact us for more info.`;
        break;
      default:
        message = `⏳ Your quote request${productName ? ` for ${productName}` : ""} is being reviewed. We'll update you soon.`;
    }

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!isSuperAdmin) {
      toast({
        title: "Access Denied",
        description: "Only super admins can change user roles.",
        variant: "destructive",
      });
      return;
    }

    setUpdatingRole(userId);

    try {
      if (newRole === "user") {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        if (error) throw error;

        toast({
          title: "Success",
          description: "User role changed to regular user.",
        });
      } else {
        await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", userId)
          .eq("role", "admin");

        const { error } = await supabase.from("user_roles").insert([
          {
            user_id: userId,
            role: newRole,
          },
        ]);

        if (error) throw error;

        toast({
          title: "Success",
          description: `User role changed to ${newRole.replace("_", " ")}.`,
        });
      }

      await fetchProfilesWithRoles();
      await Promise.all([
        fetchQuoteRequests(),
        fetchProducts(),
        fetchCategories(),
      ]);

      toast({
        title: "Data Updated",
        description: "User roles have been updated.",
      });
    } catch (error: any) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user role.",
        variant: "destructive",
      });
    }

    setUpdatingRole(null);
  };

  const toggleUserDisable = async (userId: string, isDisabled: boolean) => {
    if (!isSuperAdmin) {
      toast({
        title: "Access Denied",
        description: "Only super admins can disable/enable users.",
        variant: "destructive",
      });
      return;
    }

    setDisablingUser(userId);

    try {
      if (isDisabled) {
        // Enable user - remove from disabled_users
        const { error } = await supabase
          .from("disabled_users")
          .delete()
          .eq("user_id", userId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "User account has been enabled.",
        });
      } else {
        // Disable user - add to disabled_users
        const { error } = await supabase.from("disabled_users").insert([
          {
            user_id: userId,
            disabled_at: new Date().toISOString(),
            disabled_by: user?.id,
          },
        ]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "User account has been disabled.",
        });
      }

      await fetchProfilesWithRoles();
    } catch (error: any) {
      console.error("Error toggling user disable:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user status.",
        variant: "destructive",
      });
    }

    setDisablingUser(null);
    setDisableUserDialogOpen(false);
  };

  // User deletion function
  const deleteUser = async (userId: string, userName: string) => {
    if (!isSuperAdmin) {
      toast({
        title: "Access Denied",
        description: "Only super admins can delete users.",
        variant: "destructive",
      });
      return;
    }

    setDisablingUser(userId);

    try {
      // First, check if the user is the current user
      if (userId === user?.id) {
        toast({
          title: "Error",
          description: "You cannot delete your own account.",
          variant: "destructive",
        });
        setDisablingUser(null);
        setDeleteUserDialogOpen(false);
        return;
      }

      // Use the safe_delete_user function
      const { data, error } = await supabase.rpc("safe_delete_user", {
        user_to_delete_id: userId,
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Success",
          description: `User ${userName} has been deleted successfully.`,
        });
      } else {
        toast({
          title: "Info",
          description: data?.message || "User deletion completed",
        });
      }

      // Refresh data
      await fetchProfilesWithRoles();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete user.",
        variant: "destructive",
      });
    }

    setDisablingUser(null);
    setDeleteUserDialogOpen(false);
  };

  // Function to open delete user dialog
  const openDeleteUserDialog = (userId: string, userName: string) => {
    setDeletingUserId(userId);
    setDeletingUserName(userName);
    setDeleteUserDialogOpen(true);
  };

  const getRoleBadge = (role: string | undefined) => {
    switch (role) {
      case "super_admin":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-200 text-yellow-700 text-xs font-medium whitespace-nowrap">
            <Crown className="w-3 h-3" />
            <span className="truncate">Super Admin</span>
          </div>
        );
      case "admin":
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-200 text-blue-700 text-xs font-medium whitespace-nowrap">
            <BadgeCheck className="w-3 h-3" />
            <span className="truncate">Admin</span>
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-gray-500/10 to-gray-400/10 border border-gray-200 text-gray-700 text-xs font-medium whitespace-nowrap">
            <Users className="w-3 h-3" />
            <span className="truncate">User</span>
          </div>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-200 text-green-700 text-xs font-medium">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-200 text-red-700 text-xs font-medium">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-200 text-amber-700 text-xs font-medium">
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  const getDisabledBadge = (isDisabled: boolean = false) => {
    if (isDisabled) {
      return (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-red-500/20 to-rose-500/20 border border-red-200 text-red-700 text-xs font-medium whitespace-nowrap">
          <Ban className="w-3 h-3" />
          <span className="truncate">Disabled</span>
        </div>
      );
    }
    return null;
  };

  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm({
        name: category.name,
        description: category.description || "",
        is_active: category.is_active,
        display_order: category.display_order,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: "",
        description: "",
        is_active: true,
        display_order: categories.length,
      });
    }
    setCategoryDialogOpen(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast({
        title: "Error",
        description: "Category name is required",
        variant: "destructive",
      });
      return;
    }

    const categoryData = {
      name: categoryForm.name.trim(),
      description: categoryForm.description.trim() || null,
      is_active: categoryForm.is_active,
      display_order: categoryForm.display_order,
    };

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from("categories")
          .update(categoryData)
          .eq("id", editingCategory.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Category updated successfully",
        });
      } else {
        const { error } = await supabase
          .from("categories")
          .insert([categoryData]);

        if (error) {
          if (error.code === "23505") {
            // Unique violation
            toast({
              title: "Error",
              description: "Category with this name already exists",
              variant: "destructive",
            });
            return;
          }
          throw error;
        }
        toast({
          title: "Success",
          description: "Category created successfully",
        });
      }

      setCategoryDialogOpen(false);
      fetchCategories();
      fetchProducts(); // Refresh products to show updated categories
    } catch (error: any) {
      console.error("Error saving category:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save category",
        variant: "destructive",
      });
    }
  };

  const deleteCategory = async (id: string) => {
    // Check if any products are using this category
    const { data: productsUsingCategory, error: checkError } = await supabase
      .from("products")
      .select("id, name")
      .eq("category_id", id)
      .limit(1);

    if (checkError) {
      toast({
        title: "Error",
        description: "Failed to check category usage",
        variant: "destructive",
      });
      return;
    }

    if (productsUsingCategory && productsUsingCategory.length > 0) {
      toast({
        title: "Cannot Delete",
        description:
          "This category is being used by products. Please reassign or delete those products first.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Category deleted successfully" });
      fetchCategories();
    }
  };

  const openProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description || "",
        price: product.price?.toString() || "",
        image_url: product.image_url || "",
        category: product.category || "",
        category_id: product.category_id || "",
        specifications: product.specifications || "",
        is_trending: product.is_trending,
        is_active: product.is_active,
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        name: "",
        description: "",
        price: "",
        image_url: "",
        category: "",
        category_id: "",
        specifications: "",
        is_trending: false,
        is_active: true,
      });
    }
    setProductDialogOpen(true);
  };

  const saveProduct = async () => {
    if (!productForm.name.trim()) {
      toast({
        title: "Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    // Prepare product data
    const productData: any = {
      name: productForm.name.trim(),
      description: productForm.description.trim() || null,
      price: productForm.price ? parseFloat(productForm.price) : null,
      image_url: productForm.image_url.trim() || null,
      specifications: productForm.specifications.trim() || null,
      is_trending: productForm.is_trending,
      is_active: productForm.is_active,
    };

    // Handle category - only use category_id if it's a valid UUID
    // Otherwise use the category text field as fallback
    if (
      productForm.category_id &&
      /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
        productForm.category_id,
      )
    ) {
      productData.category_id = productForm.category_id;
      productData.category = null; // Clear the text category if using category_id
    } else if (productForm.category.trim()) {
      productData.category = productForm.category.trim();
      productData.category_id = null; // Clear category_id if using text category
    } else {
      productData.category = null;
      productData.category_id = null;
    }

    try {
      if (editingProduct) {
        const { error } = await supabase
          .from("products")
          .update(productData)
          .eq("id", editingProduct.id);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Product updated successfully",
        });
      } else {
        const { error } = await supabase.from("products").insert([productData]);

        if (error) throw error;
        toast({
          title: "Success",
          description: "Product created successfully",
        });
      }

      setProductDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save product",
        variant: "destructive",
      });
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Product deleted successfully" });
      fetchProducts();
    }
  };

  const openProfileDialog = (profile: Profile) => {
    setEditingProfile(profile);
    setProfileForm({
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone || "",
    });
    setProfileDialogOpen(true);
  };

  const saveProfile = async () => {
    if (!editingProfile) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profileForm.full_name.trim(),
        phone: profileForm.phone.trim() || null,
      })
      .eq("id", editingProfile.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } else {
      toast({ title: "Success", description: "Profile updated successfully" });
      setProfileDialogOpen(false);
      fetchProfilesWithRoles();
    }
  };

  const openQuoteDialog = (quote: QuoteRequest) => {
    setEditingQuote(quote);
    setQuoteForm({
      subject: quote.subject,
      message: quote.message,
      status: quote.status,
    });
    setQuoteDialogOpen(true);
  };

  const saveQuote = async () => {
    if (!editingQuote) return;

    setSavingQuote(true);
    const { error } = await supabase
      .from("quote_requests")
      .update({
        subject: quoteForm.subject.trim(),
        message: quoteForm.message.trim(),
        status: quoteForm.status,
      })
      .eq("id", editingQuote.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update quote request",
        variant: "destructive",
      });
    } else {
      if (quoteForm.status !== editingQuote.status) {
        try {
          await supabase.functions.invoke("send-status-notification", {
            body: {
              quote_request_id: editingQuote.id,
              status: quoteForm.status,
            },
          });
        } catch (e) {
          console.log("Notification skipped");
        }
      }
      toast({
        title: "Success",
        description: "Quote request updated successfully",
      });
      setQuoteDialogOpen(false);
      setEditingQuote(null);
      fetchQuoteRequests();
    }
    setSavingQuote(false);
  };

  const openDeleteQuoteDialog = (quoteId: string) => {
    setDeletingQuoteId(quoteId);
    setDeleteQuoteDialogOpen(true);
  };

  const deleteQuote = async () => {
    if (!deletingQuoteId) return;

    setSavingQuote(true);
    const { error } = await supabase
      .from("quote_requests")
      .delete()
      .eq("id", deletingQuoteId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete quote request",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Quote request deleted successfully",
      });
      setDeleteQuoteDialogOpen(false);
      setDeletingQuoteId(null);
      fetchQuoteRequests();
    }
    setSavingQuote(false);
  };

  const openDisableUserDialog = (userId: string) => {
    setDisablingUserId(userId);
    setDisableUserDialogOpen(true);
  };

  // Export functions
  const handleExportQuotes = (type: "excel" | "pdf") => {
    const exportData = filteredQuotes.map((request) => {
      const profile = getUserProfile(request.user_id);
      return {
        userName: profile?.full_name || "Unknown",
        userEmail: profile?.email || "-",
        subject: request.subject,
        productName: getProductName(request.product_id) || "-",
        quantity: request.quantity || 1,
        status:
          request.status.charAt(0).toUpperCase() + request.status.slice(1),
        date: format(new Date(request.created_at), "MMM d, yyyy"),
      };
    });

    if (type === "excel") {
      exportToExcel(exportData, quoteColumnsWithUser, "quote_requests");
    } else {
      exportToPDF(
        exportData,
        quoteColumnsWithUser,
        "quote_requests",
        "Quote Requests",
      );
    }
  };

  const handleExportProducts = (type: "excel" | "pdf") => {
    const exportData = products.map((product) => ({
      name: product.name,
      category: product.category || "-",
      price: product.price ? `₹${product.price.toFixed(2)}` : "-",
      is_trending: product.is_trending ? "Yes" : "No",
      is_active: product.is_active ? "Active" : "Inactive",
      description: product.description || "-",
    }));

    if (type === "excel") {
      exportToExcel(exportData, productColumns, "products");
    } else {
      exportToPDF(exportData, productColumns, "products", "Products");
    }
  };

  const handleExportUsers = (type: "excel" | "pdf") => {
    const exportData = profiles.map((profile) => ({
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone || "-",
      role: profile.role?.replace("_", " ") || "User",
      joined_at: format(new Date(profile.joined_at), "MMM d, yyyy"),
    }));

    if (type === "excel") {
      exportToExcel(exportData, userColumns, "users");
    } else {
      exportToPDF(exportData, userColumns, "users", "Registered Users");
    }
  };

  const handleExportAll = (type: "excel" | "pdf") => {
    handleExportQuotes(type);
    handleExportProducts(type);
    handleExportUsers(type);
    toast({
      title: "Export Complete",
      description: `All data exported to ${type === "excel" ? "Excel" : "PDF"} files.`,
    });
  };

  if (authLoading || checkingVerification) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isVerified) {
    return <AdminVerification onVerified={() => setIsVerified(true)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero overflow-x-hidden">
      <PageHeader />

      <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 pt-20 sm:pt-24">
        {/* Enhanced Header Section - Removed Refresh Button */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-primary/0 border border-primary/20 rounded-2xl p-4 sm:p-6 md:p-8 overflow-hidden shadow-lg relative">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-primary/5 rounded-full -translate-y-10 translate-x-10 sm:-translate-y-16 sm:translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-16 h-16 sm:w-24 sm:h-24 bg-primary/5 rounded-full translate-y-8 -translate-x-8 sm:translate-y-12 sm:-translate-x-12"></div>

            <div className="relative z-10">
              {/* Main Header Content */}
              <div className="flex flex-col gap-4">
                {/* Top Row: Icon and Title */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg flex-shrink-0">
                      <Settings className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                    </div>
                    <div>
                      <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
                        Admin Dashboard
                      </h1>
                      <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        Manage users, products, categories, and quote requests
                        with full control.
                      </p>
                    </div>
                  </div>

                  {/* Role Badge for Desktop */}
                  <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 border border-yellow-300/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
                    <span className="text-sm sm:text-base font-bold text-yellow-700 whitespace-nowrap">
                      {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
                    </span>
                  </div>
                </div>

                {/* Subtle Horizontal Separator */}
                <div className="pt-2 border-t border-primary/10"></div>

                {/* Bottom Row: Role Info - Responsive Layout */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-primary/15 to-primary/10 px-3 py-1.5 rounded-full border border-primary/30">
                      <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-primary">
                        {isSuperAdmin ? "Super Administrator" : "Administrator"}
                      </span>
                    </div>

                    {/* Role Badge for Mobile */}
                    <div className="sm:hidden flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/20 to-yellow-500/10 border border-yellow-300/30 px-2.5 py-1 rounded-full">
                      <Crown className="w-3.5 h-3.5 text-yellow-600" />
                      <span className="text-xs font-bold text-yellow-700">
                        {isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div className="sm:hidden mb-6">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between border-border/50 bg-card/50"
              >
                <div className="flex items-center gap-2">
                  {activeTab === "dashboard" && (
                    <LayoutDashboard className="w-4 h-4" />
                  )}
                  {activeTab === "quotes" && <FileText className="w-4 h-4" />}
                  {activeTab === "products" && <Package className="w-4 h-4" />}
                  {activeTab === "categories" && <Tag className="w-4 h-4" />}
                  {activeTab === "users" && <Users className="w-4 h-4" />}
                  {activeTab === "roles" && <UserPlus className="w-4 h-4" />}
                  <span className="capitalize font-medium">
                    {activeTab === "dashboard"
                      ? "Dashboard"
                      : activeTab === "quotes"
                        ? "Quotes"
                        : activeTab === "products"
                          ? "Products"
                          : activeTab === "categories"
                            ? "Categories"
                            : activeTab === "users"
                              ? "Users"
                              : "Manage Roles"}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full">
              <DropdownMenuItem
                onClick={() => setActiveTab("dashboard")}
                className="cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveTab("quotes")}
                className="cursor-pointer"
              >
                <FileText className="w-4 h-4 mr-2" /> Quotes
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveTab("products")}
                className="cursor-pointer"
              >
                <Package className="w-4 h-4 mr-2" /> Products
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveTab("categories")}
                className="cursor-pointer"
              >
                <Tag className="w-4 h-4 mr-2" /> Categories
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setActiveTab("users")}
                className="cursor-pointer"
              >
                <Users className="w-4 h-4 mr-2" /> Users
              </DropdownMenuItem>
              {isSuperAdmin && (
                <DropdownMenuItem
                  onClick={() => setActiveTab("roles")}
                  className="cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 mr-2" /> Manage Roles
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs and Export Button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          {/* Tabs for desktop with scrollable container */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="hidden sm:block w-full"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
              <div className="relative w-full max-w-3xl">
                <div className="overflow-x-auto scrollbar-hide">
                  <TabsList className="flex flex-nowrap bg-muted/50 gap-1 sm:gap-2 p-1 min-w-max">
                    <TabsTrigger
                      value="dashboard"
                      className="flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 text-sm whitespace-nowrap"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
                    </TabsTrigger>
                    <TabsTrigger
                      value="quotes"
                      className="flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 text-sm whitespace-nowrap"
                    >
                      <FileText className="w-4 h-4 mr-2" /> Quotes
                    </TabsTrigger>
                    <TabsTrigger
                      value="products"
                      className="flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 text-sm whitespace-nowrap"
                    >
                      <Package className="w-4 h-4 mr-2" /> Products
                    </TabsTrigger>
                    <TabsTrigger
                      value="categories"
                      className="flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 text-sm whitespace-nowrap"
                    >
                      <Tag className="w-4 h-4 mr-2" /> Categories
                    </TabsTrigger>
                    <TabsTrigger
                      value="users"
                      className="flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 text-sm whitespace-nowrap"
                    >
                      <Users className="w-4 h-4 mr-2" /> Users
                    </TabsTrigger>
                    {isSuperAdmin && (
                      <TabsTrigger
                        value="roles"
                        className="flex-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-4 py-2 text-sm whitespace-nowrap"
                      >
                        <UserPlus className="w-4 h-4 mr-2" /> Manage Roles
                      </TabsTrigger>
                    )}
                  </TabsList>
                </div>
              </div>

              {isSuperAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="gap-2 w-full sm:w-auto border-primary/30"
                    >
                      <Download className="w-4 h-4" />
                      Export All
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => handleExportAll("excel")}
                      className="cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Export All to Excel
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExportAll("pdf")}
                      className="cursor-pointer"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Export All to PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleExportQuotes("excel")}
                      className="cursor-pointer"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Quotes Only (Excel)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExportProducts("excel")}
                      className="cursor-pointer"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Products Only (Excel)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleExportUsers("excel")}
                      className="cursor-pointer"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Users Only (Excel)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="mt-4">
              <div className="space-y-4 sm:space-y-6">
                <AdminDashboard
                  quoteRequests={quoteRequests}
                  profiles={profiles}
                  products={products}
                  categories={categories}
                  isSuperAdmin={isSuperAdmin}
                />
                {isSuperAdmin && <AboutBannerUploader />}
              </div>
            </TabsContent>

            {/* Quote Requests Tab - Enhanced Responsive Design */}
            <TabsContent value="quotes" className="mt-4">
              <div className="bg-card rounded-xl sm:rounded-2xl shadow-card border border-border/50 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border/50">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
                          Quote Requests
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Manage and track all quote requests
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Showing {filteredQuotes.length} of {quoteRequests.length}{" "}
                      quotes
                    </div>
                  </div>

                  {/* Search and Filter Bar */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search quotes by user, subject, or message..."
                        value={quoteSearch}
                        onChange={(e) => setQuoteSearch(e.target.value)}
                        className="pl-10 border-border/50"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Select
                        value={quoteFilter}
                        onValueChange={setQuoteFilter}
                      >
                        <SelectTrigger className="w-[140px] border-border/50">
                          <Filter className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setQuoteSearch("");
                          setQuoteFilter("all");
                        }}
                        title="Clear filters"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {filteredQuotes.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                    <p>
                      {quoteSearch || quoteFilter !== "all"
                        ? "No matching quotes found"
                        : "No quote requests yet."}
                    </p>
                    {(quoteSearch || quoteFilter !== "all") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuoteSearch("");
                          setQuoteFilter("all");
                        }}
                        className="mt-2"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Desktop Table - Show on lg and above */}
                    <div className="hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              User
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Subject
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Product
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Qty
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Date
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Status
                            </TableHead>
                            {/* Show Actions column only for Super Admin */}
                            {isSuperAdmin && (
                              <TableHead className="px-4 py-3 whitespace-nowrap text-right">
                                Actions
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredQuotes.map((request) => {
                            const profile = getUserProfile(request.user_id);
                            const productName = getProductName(
                              request.product_id,
                            );
                            return (
                              <TableRow
                                key={request.id}
                                className="hover:bg-muted/10 border-b border-border/30"
                              >
                                <TableCell className="px-4 py-3">
                                  <div className="min-w-[140px] max-w-[180px]">
                                    <p className="font-medium text-foreground text-sm truncate">
                                      {profile?.full_name || "Unknown"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {profile?.email}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <span
                                    className="text-sm font-medium truncate block max-w-[200px]"
                                    title={request.subject}
                                  >
                                    {request.subject}
                                  </span>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  {productName ? (
                                    <span className="px-2 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-700 text-xs border border-blue-200 truncate inline-block max-w-[120px]">
                                      {productName}
                                    </span>
                                  ) : (
                                    "-"
                                  )}
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  {request.quantity || "-"}
                                </TableCell>
                                <TableCell className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                  {format(
                                    new Date(request.created_at),
                                    "MMM d, yyyy",
                                  )}
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  {getStatusBadge(request.status)}
                                </TableCell>
                                {/* Show Actions only for Super Admin */}
                                {isSuperAdmin ? (
                                  <TableCell className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                      <Select
                                        value={request.status}
                                        onValueChange={(value) =>
                                          updateStatus(
                                            request.id,
                                            value,
                                            profile?.email || "",
                                            profile?.phone || null,
                                            request,
                                          )
                                        }
                                        disabled={updating === request.id}
                                      >
                                        <SelectTrigger className="w-32 text-xs border-border/50 h-8 min-w-[100px]">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">
                                            Pending
                                          </SelectItem>
                                          <SelectItem value="approved">
                                            Approved
                                          </SelectItem>
                                          <SelectItem value="rejected">
                                            Rejected
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-green-100"
                                        onClick={() =>
                                          openWhatsApp(
                                            profile?.phone || null,
                                            request.status,
                                            getProductName(request.product_id),
                                          )
                                        }
                                        title="Send WhatsApp message"
                                      >
                                        <MessageCircle className="w-4 h-4 text-green-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-blue-100"
                                        onClick={() => openQuoteDialog(request)}
                                        title="Edit quote"
                                      >
                                        <Edit className="w-4 h-4 text-blue-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-red-100"
                                        onClick={() =>
                                          openDeleteQuoteDialog(request.id)
                                        }
                                        title="Delete quote"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                ) : (
                                  <TableCell className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                      {/* Normal Admin: Only WhatsApp button, NO status dropdown */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-green-100"
                                        onClick={() =>
                                          openWhatsApp(
                                            profile?.phone || null,
                                            request.status,
                                            getProductName(request.product_id),
                                          )
                                        }
                                        title="Send WhatsApp message"
                                      >
                                        <MessageCircle className="w-4 h-4 text-green-600" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Tablet View - Show on md and lg screens */}
                    <div className="hidden md:block lg:hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              User
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Subject
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Status
                            </TableHead>
                            {/* Show Actions column only for Super Admin */}
                            {isSuperAdmin && (
                              <TableHead className="px-4 py-3 whitespace-nowrap text-right">
                                Actions
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredQuotes.map((request) => {
                            const profile = getUserProfile(request.user_id);
                            const productName = getProductName(
                              request.product_id,
                            );
                            return (
                              <TableRow
                                key={request.id}
                                className="hover:bg-muted/10 border-b border-border/30"
                              >
                                <TableCell className="px-4 py-3">
                                  <div className="min-w-[120px] max-w-[150px]">
                                    <p className="font-medium text-foreground text-sm truncate">
                                      {profile?.full_name || "Unknown"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {profile?.email}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {productName && (
                                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs truncate max-w-[100px]">
                                          {productName}
                                        </span>
                                      )}
                                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        Qty: {request.quantity || "-"}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <div className="max-w-[200px]">
                                    <span
                                      className="text-sm font-medium truncate block"
                                      title={request.subject}
                                    >
                                      {request.subject}
                                    </span>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {format(
                                        new Date(request.created_at),
                                        "MMM d, yyyy",
                                      )}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  {getStatusBadge(request.status)}
                                </TableCell>
                                {/* Show Actions only for Super Admin */}
                                {isSuperAdmin ? (
                                  <TableCell className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                      <Select
                                        value={request.status}
                                        onValueChange={(value) =>
                                          updateStatus(
                                            request.id,
                                            value,
                                            profile?.email || "",
                                            profile?.phone || null,
                                            request,
                                          )
                                        }
                                        disabled={updating === request.id}
                                      >
                                        <SelectTrigger className="w-28 text-xs border-border/50 h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">
                                            Pending
                                          </SelectItem>
                                          <SelectItem value="approved">
                                            Approved
                                          </SelectItem>
                                          <SelectItem value="rejected">
                                            Rejected
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-green-100"
                                        onClick={() =>
                                          openWhatsApp(
                                            profile?.phone || null,
                                            request.status,
                                            getProductName(request.product_id),
                                          )
                                        }
                                        title="WhatsApp"
                                      >
                                        <MessageCircle className="w-4 h-4 text-green-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-red-100"
                                        onClick={() =>
                                          openDeleteQuoteDialog(request.id)
                                        }
                                        title="Delete"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                ) : (
                                  <TableCell className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-2">
                                      {/* Normal Admin: Only WhatsApp button */}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 hover:bg-green-100"
                                        onClick={() =>
                                          openWhatsApp(
                                            profile?.phone || null,
                                            request.status,
                                            getProductName(request.product_id),
                                          )
                                        }
                                        title="WhatsApp"
                                      >
                                        <MessageCircle className="w-4 h-4 text-green-600" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View - Show on md and below */}
                    <div className="md:hidden p-4 space-y-4">
                      {filteredQuotes.map((request) => {
                        const profile = getUserProfile(request.user_id);
                        const productName = getProductName(request.product_id);
                        return (
                          <Card
                            key={request.id}
                            className="border-border/50 shadow-sm"
                          >
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                {/* Header with user info and status */}
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold text-white">
                                          {profile?.full_name?.charAt(0) || "U"}
                                        </span>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-foreground truncate">
                                          {profile?.full_name || "Unknown User"}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {profile?.email}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex-shrink-0">
                                    {getStatusBadge(request.status)}
                                  </div>
                                </div>

                                {/* Quote details */}
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                      Subject
                                    </p>
                                    <p className="text-sm text-foreground line-clamp-2">
                                      {request.subject}
                                    </p>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground mb-1">
                                        Product
                                      </p>
                                      {productName ? (
                                        <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium truncate inline-block max-w-full">
                                          {productName}
                                        </span>
                                      ) : (
                                        <p className="text-sm text-muted-foreground">
                                          -
                                        </p>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-muted-foreground mb-1">
                                        Quantity
                                      </p>
                                      <p className="text-sm text-foreground">
                                        {request.quantity || "-"}
                                      </p>
                                    </div>
                                  </div>

                                  <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                      Date
                                    </p>
                                    <p className="text-sm text-foreground">
                                      {format(
                                        new Date(request.created_at),
                                        "MMM d, yyyy",
                                      )}
                                    </p>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-2 pt-3 border-t border-border/30">
                                  {/* Only show status dropdown for Super Admin */}
                                  {isSuperAdmin && (
                                    <Select
                                      value={request.status}
                                      onValueChange={(value) =>
                                        updateStatus(
                                          request.id,
                                          value,
                                          profile?.email || "",
                                          profile?.phone || null,
                                          request,
                                        )
                                      }
                                      disabled={updating === request.id}
                                    >
                                      <SelectTrigger className="w-full h-9 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="pending">
                                          Pending
                                        </SelectItem>
                                        <SelectItem value="approved">
                                          Approved
                                        </SelectItem>
                                        <SelectItem value="rejected">
                                          Rejected
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}

                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 h-9"
                                      onClick={() =>
                                        openWhatsApp(
                                          profile?.phone || null,
                                          request.status,
                                          getProductName(request.product_id),
                                        )
                                      }
                                    >
                                      <MessageCircle className="w-4 h-4 mr-2" />
                                      WhatsApp
                                    </Button>
                                    {isSuperAdmin && (
                                      <>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-9 w-9 p-0"
                                          onClick={() =>
                                            openQuoteDialog(request)
                                          }
                                        >
                                          <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="h-9 w-9 p-0"
                                          onClick={() =>
                                            openDeleteQuoteDialog(request.id)
                                          }
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Products Tab - Enhanced Responsive Design */}
            <TabsContent value="products" className="mt-4">
              <div className="bg-card rounded-xl sm:rounded-2xl shadow-card border border-border/50 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
                      <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
                        Products
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Manage your product catalog
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                      {products.length}
                    </span>
                  </div>
                  {isSuperAdmin && (
                    <Button
                      onClick={() => openProductDialog()}
                      className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Product
                    </Button>
                  )}
                </div>

                {products.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <Package className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                    <p>No products added yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Desktop Table - Show on lg and above */}
                    <div className="hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Name
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Category
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Price
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Trending
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Status
                            </TableHead>
                            {isSuperAdmin && (
                              <TableHead className="px-4 py-3 whitespace-nowrap">
                                Actions
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map((product) => (
                            <TableRow
                              key={product.id}
                              className="hover:bg-muted/10 border-b border-border/30"
                            >
                              <TableCell className="px-4 py-3">
                                <div className="min-w-[180px] max-w-[250px]">
                                  <p className="font-medium text-sm truncate">
                                    {product.name}
                                  </p>
                                  {product.description && (
                                    <p className="text-xs text-muted-foreground line-clamp-1 truncate">
                                      {product.description}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                {product.category ? (
                                  <span className="px-2 py-1 rounded-full bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-700 text-xs border border-blue-200 truncate inline-block max-w-[120px]">
                                    {product.category}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                {product.price ? (
                                  <span className="font-medium bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                    ₹{product.price.toFixed(2)}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                {product.is_trending ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-orange-700 text-xs font-medium border border-orange-200">
                                    <Flame className="w-3 h-3" /> Trending
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground text-sm">
                                    -
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    product.is_active
                                      ? "bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-700 border border-green-200"
                                      : "bg-gradient-to-r from-gray-500/10 to-gray-400/10 text-gray-700 border border-gray-200"
                                  }`}
                                >
                                  {product.is_active ? "Active" : "Inactive"}
                                </span>
                              </TableCell>
                              {isSuperAdmin && (
                                <TableCell className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-blue-100"
                                      onClick={() => openProductDialog(product)}
                                    >
                                      <Edit className="w-4 h-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-red-100"
                                      onClick={() => deleteProduct(product.id)}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Tablet View - Show on md and lg screens */}
                    <div className="hidden md:block lg:hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Name
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Category
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Price
                            </TableHead>
                            {isSuperAdmin && (
                              <TableHead className="px-4 py-3 whitespace-nowrap">
                                Actions
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {products.map((product) => (
                            <TableRow
                              key={product.id}
                              className="hover:bg-muted/10 border-b border-border/30"
                            >
                              <TableCell className="px-4 py-3">
                                <div className="min-w-[150px] max-w-[200px]">
                                  <p className="font-medium text-sm truncate">
                                    {product.name}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    {product.is_trending && (
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs">
                                        <Flame className="w-2.5 h-2.5" />
                                      </span>
                                    )}
                                    <span
                                      className={`px-1.5 py-0.5 rounded-full text-xs ${
                                        product.is_active
                                          ? "bg-green-100 text-green-700"
                                          : "bg-gray-100 text-gray-700"
                                      }`}
                                    >
                                      {product.is_active
                                        ? "Active"
                                        : "Inactive"}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                {product.category ? (
                                  <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs truncate inline-block max-w-[100px]">
                                    {product.category}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                {product.price ? (
                                  <span className="font-medium text-green-600">
                                    ₹{product.price.toFixed(2)}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </TableCell>
                              {isSuperAdmin && (
                                <TableCell className="px-4 py-3">
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-blue-100"
                                      onClick={() => openProductDialog(product)}
                                    >
                                      <Edit className="w-4 h-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-red-100"
                                      onClick={() => deleteProduct(product.id)}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View - Show on md and below */}
                    <div className="md:hidden p-4 space-y-4">
                      {products.map((product) => (
                        <Card
                          key={product.id}
                          className="border-border/50 shadow-sm"
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate">
                                    {product.name}
                                  </p>
                                  {product.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1 truncate mt-1">
                                      {product.description}
                                    </p>
                                  )}
                                </div>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                                    product.is_active
                                      ? "bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-700 border border-green-200"
                                      : "bg-gradient-to-r from-gray-500/10 to-gray-400/10 text-gray-700 border border-gray-200"
                                  }`}
                                >
                                  {product.is_active ? "Active" : "Inactive"}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    Category
                                  </p>
                                  <p className="font-medium truncate">
                                    {product.category || "-"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-xs">
                                    Price
                                  </p>
                                  <p className="font-medium text-green-600">
                                    {product.price
                                      ? `₹${product.price.toFixed(2)}`
                                      : "-"}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center justify-between pt-3 border-t">
                                <div>
                                  {product.is_trending && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-orange-700 text-xs font-medium border border-orange-200">
                                      <Flame className="w-3 h-3" /> Trending
                                    </span>
                                  )}
                                </div>
                                {isSuperAdmin && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 hover:bg-blue-100"
                                      onClick={() => openProductDialog(product)}
                                    >
                                      <Edit className="w-4 h-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 hover:bg-red-100"
                                      onClick={() => deleteProduct(product.id)}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Categories Tab - Enhanced Responsive Design */}
            <TabsContent value="categories" className="mt-4">
              <div className="bg-card rounded-xl sm:rounded-2xl shadow-card border border-border/50 overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
                      <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
                        Categories
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Organize products into categories
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                      {categories.length}
                    </span>
                  </div>
                  {isSuperAdmin && (
                    <Button
                      onClick={() => openCategoryDialog()}
                      className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Category
                    </Button>
                  )}
                </div>

                {categories.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 text-muted-foreground">
                    <Tag className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                    <p>No categories added yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    {/* Desktop Table - Show on lg and above */}
                    <div className="hidden lg:block">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Name
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Description
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Order
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Status
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Created
                            </TableHead>
                            {isSuperAdmin && (
                              <TableHead className="px-4 py-3 whitespace-nowrap">
                                Actions
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categories.map((category) => (
                            <TableRow
                              key={category.id}
                              className="hover:bg-muted/10 border-b border-border/30"
                            >
                              <TableCell className="px-4 py-3">
                                <div className="min-w-[150px] max-w-[200px] flex items-center gap-2">
                                  <Tag className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                  <span className="font-medium text-sm truncate">
                                    {category.name}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <p className="text-sm text-muted-foreground line-clamp-2 max-w-[250px] truncate">
                                  {category.description || "-"}
                                </p>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <Hash className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                  <span className="text-sm font-medium">
                                    {category.display_order}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    category.is_active
                                      ? "bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-700 border border-green-200"
                                      : "bg-gradient-to-r from-gray-500/10 to-gray-400/10 text-gray-700 border border-gray-200"
                                  }`}
                                >
                                  {category.is_active ? "Active" : "Inactive"}
                                </span>
                              </TableCell>
                              <TableCell className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                {format(
                                  new Date(category.created_at),
                                  "MMM d, yyyy",
                                )}
                              </TableCell>
                              {isSuperAdmin && (
                                <TableCell className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-blue-100"
                                      onClick={() =>
                                        openCategoryDialog(category)
                                      }
                                    >
                                      <Edit className="w-4 h-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-red-100"
                                      onClick={() =>
                                        deleteCategory(category.id)
                                      }
                                      disabled={categories.length <= 1}
                                      title={
                                        categories.length <= 1
                                          ? "Cannot delete the only category"
                                          : ""
                                      }
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Tablet View - Show on md and lg screens */}
                    <div className="hidden md:block lg:hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30">
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Name
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Status
                            </TableHead>
                            <TableHead className="px-4 py-3 whitespace-nowrap">
                              Order
                            </TableHead>
                            {isSuperAdmin && (
                              <TableHead className="px-4 py-3 whitespace-nowrap">
                                Actions
                              </TableHead>
                            )}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {categories.map((category) => (
                            <TableRow
                              key={category.id}
                              className="hover:bg-muted/10 border-b border-border/30"
                            >
                              <TableCell className="px-4 py-3">
                                <div className="min-w-[150px] max-w-[200px]">
                                  <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                                    <span className="font-medium text-sm truncate">
                                      {category.name}
                                    </span>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-1 truncate mt-1">
                                    {category.description || "No description"}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    category.is_active
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {category.is_active ? "Active" : "Inactive"}
                                </span>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <span className="text-sm font-medium">
                                  {category.display_order}
                                </span>
                              </TableCell>
                              {isSuperAdmin && (
                                <TableCell className="px-4 py-3">
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-blue-100"
                                      onClick={() =>
                                        openCategoryDialog(category)
                                      }
                                    >
                                      <Edit className="w-4 h-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-red-100"
                                      onClick={() =>
                                        deleteCategory(category.id)
                                      }
                                      disabled={categories.length <= 1}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </div>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Mobile Card View - Show on md and below */}
                    <div className="md:hidden p-4 space-y-3">
                      {categories.map((category) => (
                        <Card key={category.id} className="border-border/50">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center flex-shrink-0">
                                  <Tag className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-foreground truncate">
                                    {category.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground line-clamp-1 truncate">
                                    {category.description || "No description"}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                                  category.is_active
                                    ? "bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-700 border border-green-200"
                                    : "bg-gradient-to-r from-gray-500/10 to-gray-400/10 text-gray-700 border border-gray-200"
                                }`}
                              >
                                {category.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-3 border-t">
                              <div className="flex items-center gap-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Order
                                  </p>
                                  <p className="text-sm font-medium">
                                    {category.display_order}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Created
                                  </p>
                                  <p className="text-sm">
                                    {format(
                                      new Date(category.created_at),
                                      "MMM d, yyyy",
                                    )}
                                  </p>
                                </div>
                              </div>
                              {isSuperAdmin && (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 hover:bg-blue-100"
                                    onClick={() => openCategoryDialog(category)}
                                  >
                                    <Edit className="w-4 h-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 hover:bg-red-100"
                                    onClick={() => deleteCategory(category.id)}
                                    disabled={categories.length <= 1}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Users Tab - Available for All Admins (Read Only for non-Super) */}
            <TabsContent value="users" className="mt-4">
              <div className="space-y-4 sm:space-y-6">
                <div className="bg-card rounded-xl sm:rounded-2xl shadow-card border border-border/50 overflow-hidden">
                  <div className="p-4 sm:p-6 border-b border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 flex items-center justify-center">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
                          All Users
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          View registered users {!isSuperAdmin && "(Read Only)"}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                        {filteredProfiles.length}
                      </span>
                    </div>
                  </div>

                  {filteredProfiles.length === 0 ? (
                    <div className="text-center py-8 sm:py-12 text-muted-foreground">
                      <Users className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                      <p>No users registered yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      {/* Desktop Table - Show on lg and above */}
                      <div className="hidden lg:block">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="px-4 py-3 whitespace-nowrap">
                                Name
                              </TableHead>
                              <TableHead className="px-4 py-3 whitespace-nowrap">
                                Email
                              </TableHead>
                              <TableHead className="px-4 py-3 whitespace-nowrap">
                                Phone
                              </TableHead>
                              {isSuperAdmin ? (
                                <>
                                  <TableHead className="px-4 py-3 whitespace-nowrap">
                                    Status
                                  </TableHead>
                                  <TableHead className="px-4 py-3 whitespace-nowrap">
                                    Role
                                  </TableHead>
                                </>
                              ) : null}
                              <TableHead className="px-4 py-3 whitespace-nowrap">
                                Joined
                              </TableHead>
                              {isSuperAdmin && (
                                <TableHead className="px-4 py-3 whitespace-nowrap">
                                  Actions
                                </TableHead>
                              )}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredProfiles.map((profile) => (
                              <TableRow
                                key={profile.id}
                                className="hover:bg-muted/10 border-b border-border/30"
                              >
                                <TableCell className="px-4 py-3">
                                  <span className="font-medium text-sm truncate max-w-[150px] block">
                                    {profile.full_name}
                                  </span>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <p className="text-sm truncate max-w-[200px]">
                                    {profile.email}
                                  </p>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <p className="text-sm truncate max-w-[120px]">
                                    {profile.phone || "-"}
                                  </p>
                                </TableCell>
                                {isSuperAdmin ? (
                                  <>
                                    <TableCell className="px-4 py-3">
                                      {getDisabledBadge(profile.is_disabled)}
                                    </TableCell>
                                    <TableCell className="px-4 py-3">
                                      <div className="flex-shrink-0">
                                        {getRoleBadge(profile.role)}
                                      </div>
                                    </TableCell>
                                  </>
                                ) : null}
                                <TableCell className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                  {format(
                                    new Date(profile.joined_at),
                                    "MMM d, yyyy",
                                  )}
                                </TableCell>
                                {isSuperAdmin && (
                                  <TableCell className="px-4 py-3">
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-blue-100"
                                        onClick={() =>
                                          openProfileDialog(profile)
                                        }
                                        title="Edit user"
                                      >
                                        <Edit className="w-4 h-4 text-blue-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-green-100"
                                        onClick={() =>
                                          openDisableUserDialog(profile.user_id)
                                        }
                                        title={
                                          profile.is_disabled
                                            ? "Enable user"
                                            : "Disable user"
                                        }
                                      >
                                        {profile.is_disabled ? (
                                          <UserX className="w-4 h-4 text-green-600" />
                                        ) : (
                                          <Ban className="w-4 h-4 text-red-600" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-red-100"
                                        onClick={() =>
                                          openDeleteUserDialog(
                                            profile.user_id,
                                            profile.full_name,
                                          )
                                        }
                                        title="Delete user"
                                        disabled={profile.user_id === user?.id}
                                      >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Tablet View - Show on md and lg screens */}
                      <div className="hidden md:block lg:hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="px-4 py-3 whitespace-nowrap">
                                Name
                              </TableHead>
                              <TableHead className="px-4 py-3 whitespace-nowrap">
                                Email
                              </TableHead>
                              {isSuperAdmin ? (
                                <TableHead className="px-4 py-3 whitespace-nowrap">
                                  Role
                                </TableHead>
                              ) : null}
                              {isSuperAdmin && (
                                <TableHead className="px-4 py-3 whitespace-nowrap">
                                  Actions
                                </TableHead>
                              )}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredProfiles.map((profile) => (
                              <TableRow
                                key={profile.id}
                                className="hover:bg-muted/10 border-b border-border/30"
                              >
                                <TableCell className="px-4 py-3">
                                  <div className="min-w-[150px] max-w-[200px]">
                                    <span className="font-medium text-sm truncate block">
                                      {profile.full_name}
                                    </span>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {profile.phone || "-"}
                                    </p>
                                  </div>
                                </TableCell>
                                <TableCell className="px-4 py-3">
                                  <p className="text-sm truncate max-w-[180px]">
                                    {profile.email}
                                  </p>
                                </TableCell>
                                {isSuperAdmin ? (
                                  <TableCell className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <div className="flex-shrink-0">
                                        {getRoleBadge(profile.role)}
                                      </div>
                                      {profile.is_disabled && (
                                        <span className="text-xs text-red-600 font-medium">
                                          (Disabled)
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                ) : null}
                                {isSuperAdmin && (
                                  <TableCell className="px-4 py-3">
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-blue-100"
                                        onClick={() =>
                                          openProfileDialog(profile)
                                        }
                                      >
                                        <Edit className="w-4 h-4 text-blue-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-green-100"
                                        onClick={() =>
                                          openDisableUserDialog(profile.user_id)
                                        }
                                        title={
                                          profile.is_disabled
                                            ? "Enable user"
                                            : "Disable user"
                                        }
                                      >
                                        {profile.is_disabled ? (
                                          <UserX className="w-4 h-4 text-green-600" />
                                        ) : (
                                          <Ban className="w-4 h-4 text-red-600" />
                                        )}
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 hover:bg-red-100"
                                        onClick={() =>
                                          openDeleteUserDialog(
                                            profile.user_id,
                                            profile.full_name,
                                          )
                                        }
                                        title="Delete user"
                                        disabled={profile.user_id === user?.id}
                                      >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Card View - Show on md and below */}
                      <div className="md:hidden p-4 space-y-3">
                        {filteredProfiles.map((profile) => (
                          <Card key={profile.id} className="border-border/50">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">
                                      {profile.full_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {profile.email}
                                    </p>
                                  </div>
                                  {isSuperAdmin ? (
                                    <div className="flex flex-col items-end gap-1">
                                      <div className="flex-shrink-0">
                                        {getRoleBadge(profile.role)}
                                      </div>
                                      {profile.is_disabled && (
                                        <div className="flex-shrink-0 mt-1">
                                          {getDisabledBadge(
                                            profile.is_disabled,
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : null}
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-muted-foreground text-xs">
                                      Phone
                                    </p>
                                    <p className="font-medium truncate">
                                      {profile.phone || "-"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">
                                      Joined
                                    </p>
                                    <p className="font-medium">
                                      {format(
                                        new Date(profile.joined_at),
                                        "MMM d, yyyy",
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="pt-3 border-t">
                                  {isSuperAdmin ? (
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 border-border/50"
                                        onClick={() =>
                                          openProfileDialog(profile)
                                        }
                                      >
                                        <Edit className="w-4 h-4 mr-2" /> Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 border-border/50"
                                        onClick={() =>
                                          openDisableUserDialog(profile.user_id)
                                        }
                                      >
                                        {profile.is_disabled ? (
                                          <>
                                            <UserX className="w-4 h-4 mr-2" />{" "}
                                            Enable
                                          </>
                                        ) : (
                                          <>
                                            <Ban className="w-4 h-4 mr-2" />{" "}
                                            Disable
                                          </>
                                        )}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 border-border/50"
                                        onClick={() =>
                                          openDeleteUserDialog(
                                            profile.user_id,
                                            profile.full_name,
                                          )
                                        }
                                        disabled={profile.user_id === user?.id}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />{" "}
                                        Delete
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-muted-foreground p-2 text-center bg-gray-50 rounded-lg border border-gray-200">
                                      <Info className="w-3 h-3 inline-block mr-1" />
                                      Only Super Admins can edit user profiles
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Manage Roles Tab - Super Admin Only */}
            {/* Manage Roles Tab - Super Admin Only */}
            {isSuperAdmin && (
              <TabsContent value="roles" className="mt-4">
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-card rounded-xl sm:rounded-2xl shadow-card border border-border/50 overflow-hidden">
                    <div className="p-4 sm:p-6 border-b border-border/50">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center">
                            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                          </div>
                          <div>
                            <h2 className="font-display text-lg sm:text-xl font-semibold text-foreground">
                              Role Management
                            </h2>
                            <p className="text-sm text-muted-foreground">
                              Manage user permissions and access levels
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6">
                      {profiles.length === 0 ? (
                        <div className="text-center py-6 sm:py-8 text-muted-foreground">
                          <Shield className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No users found</p>
                        </div>
                      ) : (
                        <div className="space-y-3 sm:space-y-4">
                          {profiles.map((profile) => {
                            const isCurrentUser = profile.user_id === user?.id;
                            const isSuperAdminUser =
                              profile.role === "super_admin";
                            return (
                              <div
                                key={profile.id}
                                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border ${
                                  isSuperAdminUser
                                    ? "bg-gradient-to-r from-yellow-50 to-orange-50/50 border-yellow-200"
                                    : profile.role === "admin"
                                      ? "bg-gradient-to-r from-blue-50 to-indigo-50/50 border-blue-200"
                                      : "bg-background border-border/50"
                                } ${profile.is_disabled ? "opacity-70" : ""}`}
                              >
                                <div className="flex items-center gap-3 mb-3 sm:mb-0">
                                  <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                      isSuperAdminUser
                                        ? "bg-gradient-to-br from-yellow-100 to-yellow-200"
                                        : profile.role === "admin"
                                          ? "bg-gradient-to-br from-blue-100 to-indigo-100"
                                          : "bg-gradient-to-br from-gray-100 to-gray-200"
                                    }`}
                                  >
                                    {isSuperAdminUser ? (
                                      <Crown className="w-5 h-5 text-yellow-600" />
                                    ) : profile.role === "admin" ? (
                                      <BadgeCheck className="w-5 h-5 text-blue-600" />
                                    ) : (
                                      <Users className="w-5 h-5 text-gray-600" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <p className="font-medium text-foreground text-sm truncate">
                                        {profile.full_name}
                                      </p>
                                      <div className="flex-shrink-0">
                                        {getRoleBadge(profile.role)}
                                      </div>
                                      {profile.is_disabled && (
                                        <div className="flex-shrink-0">
                                          {getDisabledBadge(true)}
                                        </div>
                                      )}
                                      {isCurrentUser && (
                                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                          You
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {profile.email}
                                    </p>
                                  </div>
                                </div>

                                {/* Role Selector - Only for non-superadmin users */}
                                {!isSuperAdminUser && (
                                  <div className="flex items-center gap-2">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="gap-2 w-full sm:w-auto border-border/50"
                                          disabled={
                                            updatingRole === profile.user_id ||
                                            profile.is_disabled
                                          }
                                        >
                                          {updatingRole === profile.user_id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <>
                                              Change Role
                                              <ChevronDown className="w-4 h-4" />
                                            </>
                                          )}
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="end"
                                        className="w-40"
                                      >
                                        <DropdownMenuItem
                                          onClick={() =>
                                            updateUserRole(
                                              profile.user_id,
                                              "user",
                                            )
                                          }
                                          className={`cursor-pointer ${profile.role === "user" ? "bg-muted" : ""}`}
                                        >
                                          <Users className="w-4 h-4 mr-2" />
                                          User
                                          {profile.role === "user" && (
                                            <span className="ml-auto">✓</span>
                                          )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() =>
                                            updateUserRole(
                                              profile.user_id,
                                              "admin",
                                            )
                                          }
                                          className={`cursor-pointer ${profile.role === "admin" ? "bg-muted" : ""}`}
                                        >
                                          <BadgeCheck className="w-4 h-4 mr-2" />
                                          Admin
                                          {profile.role === "admin" && (
                                            <span className="ml-auto">✓</span>
                                          )}
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    {/* REMOVED: Disable and Delete buttons from here */}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>

          {/* Mobile Content Views */}
          <div className="sm:hidden w-full">
            {activeTab === "dashboard" && (
              <div className="space-y-4">
                <AdminDashboard
                  quoteRequests={quoteRequests}
                  profiles={profiles}
                  products={products}
                  categories={categories}
                  isSuperAdmin={isSuperAdmin}
                />
                {isSuperAdmin && <AboutBannerUploader />}
              </div>
            )}

            {activeTab === "quotes" && (
              <div className="space-y-4">
                <Card className="shadow-card border-border/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          Quote Requests
                        </CardTitle>
                        <CardDescription>
                          Manage all quote requests from users
                        </CardDescription>
                      </div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search quotes..."
                          value={quoteSearch}
                          onChange={(e) => setQuoteSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Select
                          value={quoteFilter}
                          onValueChange={setQuoteFilter}
                        >
                          <SelectTrigger className="flex-1">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Filter by status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setQuoteSearch("");
                            setQuoteFilter("all");
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredQuotes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p>
                          {quoteSearch || quoteFilter !== "all"
                            ? "No matching quotes found"
                            : "No quote requests yet."}
                        </p>
                        {(quoteSearch || quoteFilter !== "all") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setQuoteSearch("");
                              setQuoteFilter("all");
                            }}
                            className="mt-2"
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filteredQuotes.map((request) => {
                          const profile = getUserProfile(request.user_id);
                          const productName = getProductName(
                            request.product_id,
                          );
                          return (
                            <Card key={request.id} className="border-border/50">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                                          <span className="text-xs font-bold text-white">
                                            {profile?.full_name?.charAt(0) ||
                                              "U"}
                                          </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-semibold text-foreground truncate">
                                            {profile?.full_name ||
                                              "Unknown User"}
                                          </p>
                                          <p className="text-xs text-muted-foreground truncate">
                                            {profile?.email}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex-shrink-0 ml-2">
                                      {getStatusBadge(request.status)}
                                    </div>
                                  </div>

                                  <div className="border-t pt-3">
                                    <p className="font-medium text-sm mb-2 text-foreground">
                                      Subject
                                    </p>
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                                      {request.subject}
                                    </p>

                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                          Product
                                        </p>
                                        {productName ? (
                                          <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-medium truncate inline-block max-w-full">
                                            {productName}
                                          </span>
                                        ) : (
                                          <p className="text-sm text-muted-foreground">
                                            -
                                          </p>
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-xs font-medium text-muted-foreground mb-1">
                                          Quantity
                                        </p>
                                        <p className="text-sm text-foreground">
                                          {request.quantity || "-"}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="mb-3">
                                      <p className="text-xs font-medium text-muted-foreground mb-1">
                                        Date
                                      </p>
                                      <p className="text-sm text-foreground">
                                        {format(
                                          new Date(request.created_at),
                                          "MMM d, yyyy",
                                        )}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-2 pt-3 border-t">
                                    {/* Only show status dropdown for Super Admin */}
                                    {isSuperAdmin && (
                                      <Select
                                        value={request.status}
                                        onValueChange={(value) =>
                                          updateStatus(
                                            request.id,
                                            value,
                                            profile?.email || "",
                                            profile?.phone || null,
                                            request,
                                          )
                                        }
                                        disabled={updating === request.id}
                                      >
                                        <SelectTrigger className="h-9 text-sm">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">
                                            Pending
                                          </SelectItem>
                                          <SelectItem value="approved">
                                            Approved
                                          </SelectItem>
                                          <SelectItem value="rejected">
                                            Rejected
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}

                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 h-9"
                                        onClick={() =>
                                          openWhatsApp(
                                            profile?.phone || null,
                                            request.status,
                                            getProductName(request.product_id),
                                          )
                                        }
                                      >
                                        <MessageCircle className="w-4 h-4 mr-2" />
                                        WhatsApp
                                      </Button>
                                      {isSuperAdmin && (
                                        <>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 w-9 p-0"
                                            onClick={() =>
                                              openQuoteDialog(request)
                                            }
                                          >
                                            <Edit className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9 w-9 p-0"
                                            onClick={() =>
                                              openDeleteQuoteDialog(request.id)
                                            }
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-4">
                <Card className="shadow-card border-border/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          Products
                        </CardTitle>
                        <CardDescription>
                          Manage all products in your store
                        </CardDescription>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                        {products.length}
                      </span>
                    </div>
                    {isSuperAdmin && (
                      <Button
                        onClick={() => openProductDialog()}
                        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Product
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {products.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p>No products added yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {products.map((product) => (
                          <Card key={product.id} className="border-border/50">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">
                                      {product.name}
                                    </p>
                                    {product.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-1 truncate">
                                        {product.description}
                                      </p>
                                    )}
                                  </div>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                                      product.is_active
                                        ? "bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-700 border border-green-200"
                                        : "bg-gradient-to-r from-gray-500/10 to-gray-400/10 text-gray-700 border border-gray-200"
                                    }`}
                                  >
                                    {product.is_active ? "Active" : "Inactive"}
                                  </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-muted-foreground text-xs">
                                      Category
                                    </p>
                                    <p className="font-medium truncate">
                                      {product.category || "-"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">
                                      Price
                                    </p>
                                    <p className="font-medium bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                      {product.price
                                        ? `₹${product.price.toFixed(2)}`
                                        : "-"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-3 border-t">
                                  <div>
                                    {product.is_trending && (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-orange-500/20 to-orange-600/10 text-orange-700 text-xs font-medium border border-orange-200">
                                        <Flame className="w-3 h-3" /> Trending
                                      </span>
                                    )}
                                  </div>
                                  {isSuperAdmin && (
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 hover:bg-blue-100"
                                        onClick={() =>
                                          openProductDialog(product)
                                        }
                                      >
                                        <Edit className="w-4 h-4 text-blue-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 hover:bg-red-100"
                                        onClick={() =>
                                          deleteProduct(product.id)
                                        }
                                      >
                                        <Trash2 className="w-4 h-4 text-red-600" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "categories" && (
              <div className="space-y-4">
                <Card className="shadow-card border-border/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          Categories
                        </CardTitle>
                        <CardDescription>
                          Manage product categories
                        </CardDescription>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                        {categories.length}
                      </span>
                    </div>
                    {isSuperAdmin && (
                      <Button
                        onClick={() => openCategoryDialog()}
                        className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                      >
                        <Plus className="w-4 h-4 mr-2" /> Add Category
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {categories.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Tag className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p>No categories added yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {categories.map((category) => (
                          <Card key={category.id} className="border-border/50">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center flex-shrink-0">
                                    <Tag className="w-4 h-4 text-emerald-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">
                                      {category.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-1 truncate">
                                      {category.description || "No description"}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                                    category.is_active
                                      ? "bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-700 border border-green-200"
                                      : "bg-gradient-to-r from-gray-500/10 to-gray-400/10 text-gray-700 border border-gray-200"
                                  }`}
                                >
                                  {category.is_active ? "Active" : "Inactive"}
                                </span>
                              </div>

                              <div className="flex items-center justify-between mt-4 pt-3 border-t">
                                <div className="flex items-center gap-4">
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Order
                                    </p>
                                    <p className="text-sm font-medium">
                                      {category.display_order}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">
                                      Created
                                    </p>
                                    <p className="text-sm">
                                      {format(
                                        new Date(category.created_at),
                                        "MMM d, yyyy",
                                      )}
                                    </p>
                                  </div>
                                </div>
                                {isSuperAdmin && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 hover:bg-blue-100"
                                      onClick={() =>
                                        openCategoryDialog(category)
                                      }
                                    >
                                      <Edit className="w-4 h-4 text-blue-600" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 hover:bg-red-100"
                                      onClick={() =>
                                        deleteCategory(category.id)
                                      }
                                      disabled={categories.length <= 1}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "users" && (
              <div className="space-y-4">
                <Card className="shadow-card border-border/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">
                          All Users
                        </CardTitle>
                        <CardDescription>
                          View registered users {!isSuperAdmin && "(Read Only)"}
                        </CardDescription>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                        {filteredProfiles.length}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {filteredProfiles.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p>No users registered yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredProfiles.map((profile) => (
                          <Card key={profile.id} className="border-border/50">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground truncate">
                                      {profile.full_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {profile.email}
                                    </p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-muted-foreground text-xs">
                                      Phone
                                    </p>
                                    <p className="font-medium truncate">
                                      {profile.phone || "-"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground text-xs">
                                      Joined
                                    </p>
                                    <p className="font-medium">
                                      {format(
                                        new Date(profile.joined_at),
                                        "MMM d, yyyy",
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="pt-3 border-t">
                                  {isSuperAdmin ? (
                                    <div className="flex gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 border-border/50"
                                        onClick={() =>
                                          openProfileDialog(profile)
                                        }
                                      >
                                        <Edit className="w-4 h-4 mr-2" /> Edit
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 border-border/50"
                                        onClick={() =>
                                          openDisableUserDialog(profile.user_id)
                                        }
                                      >
                                        {profile.is_disabled ? (
                                          <>
                                            <UserX className="w-4 h-4 mr-2" />{" "}
                                            Enable
                                          </>
                                        ) : (
                                          <>
                                            <Ban className="w-4 h-4 mr-2" />{" "}
                                            Disable
                                          </>
                                        )}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1 border-border/50"
                                        onClick={() =>
                                          openDeleteUserDialog(
                                            profile.user_id,
                                            profile.full_name,
                                          )
                                        }
                                        disabled={profile.user_id === user?.id}
                                      >
                                        <Trash2 className="w-4 h-4 mr-2" />{" "}
                                        Delete
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="text-xs text-muted-foreground p-2 text-center bg-gray-50 rounded-lg border border-gray-200">
                                      <Info className="w-3 h-3 inline-block mr-1" />
                                      Only Super Admins can manage users
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "roles" && isSuperAdmin && (
              <div className="space-y-4">
                <Card className="shadow-card border-border/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-yellow-600" />
                      </div>
                      <CardTitle className="text-lg font-semibold">
                        Role Management
                      </CardTitle>
                    </div>
                    <CardDescription>
                      As a Super Admin, you can promote users to Admin or demote
                      them back to User.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {profiles.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Shield className="w-10 h-10 mx-auto mb-3 opacity-50" />
                        <p>No users found</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {profiles.map((profile) => {
                          const isCurrentUser = profile.user_id === user?.id;
                          const isSuperAdminUser =
                            profile.role === "super_admin";
                          return (
                            <Card
                              key={profile.id}
                              className={`border ${
                                isSuperAdminUser
                                  ? "border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50/50"
                                  : profile.role === "admin"
                                    ? "border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/50"
                                    : "border-border"
                              } ${profile.is_disabled ? "opacity-70" : ""}`}
                            >
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <div
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                          isSuperAdminUser
                                            ? "bg-gradient-to-br from-yellow-100 to-yellow-200"
                                            : profile.role === "admin"
                                              ? "bg-gradient-to-br from-blue-100 to-indigo-100"
                                              : "bg-gradient-to-br from-gray-100 to-gray-200"
                                        }`}
                                      >
                                        {isSuperAdminUser ? (
                                          <Crown className="w-4 h-4 text-yellow-600" />
                                        ) : profile.role === "admin" ? (
                                          <BadgeCheck className="w-4 h-4 text-blue-600" />
                                        ) : (
                                          <Users className="w-4 h-4 text-gray-600" />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-foreground truncate">
                                          {profile.full_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {profile.email}
                                        </p>
                                      </div>
                                    </div>
                                    {isCurrentUser && (
                                      <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs flex-shrink-0">
                                        You
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex-shrink-0">
                                      {getRoleBadge(profile.role)}
                                    </div>
                                    {profile.is_disabled && (
                                      <div className="flex-shrink-0">
                                        {getDisabledBadge(true)}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between pt-2">
                                    {!isSuperAdminUser && (
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-2 border-border/50"
                                            disabled={
                                              updatingRole ===
                                                profile.user_id ||
                                              profile.is_disabled
                                            }
                                          >
                                            {updatingRole ===
                                            profile.user_id ? (
                                              <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                              <>
                                                Change Role
                                                <ChevronDown className="w-4 h-4" />
                                              </>
                                            )}
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                          align="end"
                                          className="w-40"
                                        >
                                          <DropdownMenuItem
                                            onClick={() =>
                                              updateUserRole(
                                                profile.user_id,
                                                "user",
                                              )
                                            }
                                            className={`cursor-pointer ${profile.role === "user" ? "bg-muted" : ""}`}
                                          >
                                            <Users className="w-4 h-4 mr-2" />
                                            User
                                            {profile.role === "user" && (
                                              <span className="ml-auto">✓</span>
                                            )}
                                          </DropdownMenuItem>
                                          <DropdownMenuItem
                                            onClick={() =>
                                              updateUserRole(
                                                profile.user_id,
                                                "admin",
                                              )
                                            }
                                            className={`cursor-pointer ${profile.role === "admin" ? "bg-muted" : ""}`}
                                          >
                                            <BadgeCheck className="w-4 h-4 mr-2" />
                                            Admin
                                            {profile.role === "admin" && (
                                              <span className="ml-auto">✓</span>
                                            )}
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    )}
                                    {/* REMOVED: Disable and Delete buttons from here */}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Product Dialog - Enhanced Responsive Design */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 sm:p-0">
          <div className="sticky top-0 z-10 bg-background border-b px-4 sm:px-6 py-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                {editingProduct ? "Edit Product" : "Add New Product"}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {editingProduct
                  ? "Update product details below."
                  : "Fill in the product details below."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="px-4 sm:px-6 py-4">
            <div className="space-y-4 sm:space-y-6">
              {/* Basic Information */}
              <div className="bg-gradient-to-r from-purple-50/50 to-purple-50/30 p-4 sm:p-6 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                  Basic Information
                </h3>

                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <Label className="text-sm font-medium">
                      Product Name *
                    </Label>
                    <Input
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      placeholder="Enter product name"
                      className="mt-1 bg-white text-sm sm:text-base"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <Textarea
                      value={productForm.description}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          description: e.target.value,
                        })
                      }
                      placeholder="Describe the product..."
                      rows={2}
                      className="mt-1 bg-white text-sm sm:text-base min-h-[80px]"
                    />
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div className="bg-gradient-to-r from-blue-50/50 to-blue-50/30 p-4 sm:p-6 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                  Specifications
                </h3>

                <div>
                  <Label className="text-sm font-medium">
                    Technical Specifications
                  </Label>
                  <Textarea
                    value={productForm.specifications}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        specifications: e.target.value,
                      })
                    }
                    placeholder="Enter technical specifications (dimensions, materials, etc.)"
                    rows={3}
                    className="mt-1 bg-white text-sm sm:text-base min-h-[100px]"
                  />
                </div>
              </div>

              {/* Pricing & Category - Responsive Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-gradient-to-r from-green-50/50 to-green-50/30 p-4 sm:p-6 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                    Pricing
                  </h3>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Price (₹)</Label>
                      <div className="relative mt-1">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                          ₹
                        </span>
                        <Input
                          type="number"
                          value={productForm.price}
                          onChange={(e) =>
                            setProductForm({
                              ...productForm,
                              price: e.target.value,
                            })
                          }
                          placeholder="0.00"
                          className="pl-8 bg-white text-sm sm:text-base"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">
                        Quantity (Optional)
                      </Label>
                      <Input
                        type="number"
                        placeholder="Available quantity"
                        className="mt-1 bg-white text-sm sm:text-base"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50/50 to-amber-50/30 p-4 sm:p-6 rounded-lg border border-amber-200">
                  <h3 className="font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                    <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                    Category
                  </h3>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <Label className="text-sm font-medium">
                        Select Category
                      </Label>
                      <div className="flex flex-col sm:flex-row gap-2 mt-1">
                        <Select
                          value={productForm.category_id}
                          onValueChange={(value) => {
                            const category = categories.find(
                              (c) => c.id === value,
                            );
                            setProductForm({
                              ...productForm,
                              category_id: value,
                              category: category?.name || "",
                            });
                          }}
                        >
                          <SelectTrigger className="flex-1 border-border/50 bg-white text-sm sm:text-base">
                            <SelectValue placeholder="Choose category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories
                              .filter((c) => c.is_active)
                              .map((category) => (
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                  className="text-sm"
                                >
                                  {category.name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openCategoryDialog()}
                          title="Add new category"
                          className="border-border/50 bg-white h-10 sm:h-10"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">
                        Or Create New Category
                      </Label>
                      <Input
                        value={productForm.category}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            category: e.target.value,
                            category_id: "", // Clear category_id when typing manually
                          })
                        }
                        placeholder="Type new category name"
                        className="mt-1 bg-white text-sm sm:text-base"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Upload - Enhanced Responsive Design */}
              <div className="bg-gradient-to-r from-pink-50/50 to-pink-50/30 p-4 sm:p-6 rounded-lg border border-pink-200">
                <h3 className="font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  Product Image
                </h3>

                <div className="mt-2">
                  <ImageUploader
                    value={productForm.image_url}
                    onChange={(url) =>
                      setProductForm({ ...productForm, image_url: url })
                    }
                    placeholder="Enter image URL or upload"
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Recommended: 800x600px, JPG/PNG format, max 2MB
                  </p>
                </div>

                {/* Preview Image if Available */}
                {productForm.image_url && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium mb-2 block">
                      Image Preview
                    </Label>
                    <div className="relative w-full max-w-[200px] mx-auto">
                      <img
                        src={productForm.image_url}
                        alt="Product preview"
                        className="rounded-lg border border-border w-full h-auto"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Status & Flags */}
              <div className="bg-gradient-to-r from-gray-50/50 to-gray-50/30 p-4 sm:p-6 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                  Status & Flags
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-border">
                      <Checkbox
                        id="is_active"
                        checked={productForm.is_active}
                        onCheckedChange={(checked) =>
                          setProductForm({
                            ...productForm,
                            is_active: !!checked,
                          })
                        }
                      />
                      <Label
                        htmlFor="is_active"
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${productForm.is_active ? "bg-green-500" : "bg-gray-300"}`}
                        />
                        <span>Active Product</span>
                      </Label>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-border">
                      <Checkbox
                        id="is_trending"
                        checked={productForm.is_trending}
                        onCheckedChange={(checked) =>
                          setProductForm({
                            ...productForm,
                            is_trending: !!checked,
                          })
                        }
                      />
                      <Label
                        htmlFor="is_trending"
                        className="flex items-center gap-2 cursor-pointer flex-1"
                      >
                        <Flame
                          className={`w-4 h-4 ${productForm.is_trending ? "text-orange-500" : "text-gray-400"}`}
                        />
                        <span>Trending / In Demand</span>
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-center justify-center p-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg border border-purple-200">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">
                        Product ID
                      </p>
                      <p className="font-mono text-sm text-purple-700 truncate">
                        {editingProduct ? editingProduct.id : "New Product"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-background border-t px-4 sm:px-6 py-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => setProductDialogOpen(false)}
                className="border-border/50"
              >
                Cancel
              </Button>
              <Button
                onClick={saveProduct}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingProduct ? "Update Product" : "Save Product"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-emerald-600" />
              {editingCategory ? "Edit Category" : "Add New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update category details below."
                : "Fill in the category details below."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={categoryForm.name}
                onChange={(e) =>
                  setCategoryForm({ ...categoryForm, name: e.target.value })
                }
                placeholder="Category name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm({
                    ...categoryForm,
                    description: e.target.value,
                  })
                }
                placeholder="Category description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={categoryForm.display_order}
                  onChange={(e) =>
                    setCategoryForm({
                      ...categoryForm,
                      display_order: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={categoryForm.is_active ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setCategoryForm({
                      ...categoryForm,
                      is_active: value === "active",
                    })
                  }
                >
                  <SelectTrigger className="border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCategoryDialogOpen(false)}
                className="border-border/50"
              >
                Cancel
              </Button>
              <Button
                onClick={saveCategory}
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
              >
                <Save className="w-4 h-4 mr-2" /> Save Category
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Edit Dialog - Only for Super Admins */}
      {isSuperAdmin && (
        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User Profile</DialogTitle>
              <DialogDescription>
                Update user profile details below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={profileForm.full_name}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      full_name: e.target.value,
                    })
                  }
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Email (read-only)</Label>
                <Input
                  value={profileForm.email}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, phone: e.target.value })
                  }
                  placeholder="Phone number"
                />
              </div>
              <Button
                onClick={saveProfile}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Quote Edit Dialog - Only for Super Admins */}
      {isSuperAdmin && (
        <Dialog open={quoteDialogOpen} onOpenChange={setQuoteDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Edit Quote Request
              </DialogTitle>
              <DialogDescription>
                Update quote request details below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Subject</Label>
                <Input
                  value={quoteForm.subject}
                  onChange={(e) =>
                    setQuoteForm({ ...quoteForm, subject: e.target.value })
                  }
                  placeholder="Subject"
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  value={quoteForm.message}
                  onChange={(e) =>
                    setQuoteForm({ ...quoteForm, message: e.target.value })
                  }
                  placeholder="Message"
                  rows={4}
                />
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={quoteForm.status}
                  onValueChange={(value) =>
                    setQuoteForm({ ...quoteForm, status: value })
                  }
                >
                  <SelectTrigger className="border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={saveQuote}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                disabled={savingQuote}
              >
                {savingQuote ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Quote Confirmation - Only for Super Admins */}
      {isSuperAdmin && (
        <Dialog
          open={deleteQuoteDialogOpen}
          onOpenChange={setDeleteQuoteDialogOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-5 h-5" />
                Delete Quote Request
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this quote request? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteQuoteDialogOpen(false)}
                disabled={savingQuote}
                className="border-border/50"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={deleteQuote}
                disabled={savingQuote}
              >
                {savingQuote ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Disable User Confirmation Dialog - Only for Super Admins */}
      {/* Disable User Confirmation Dialog - Only for Super Admins */}
      {isSuperAdmin && (
        <Dialog
          open={disableUserDialogOpen}
          onOpenChange={setDisableUserDialogOpen}
        >
          <DialogContent className="sm:max-w-md w-[90vw] max-w-[95vw]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                {disablingUserId &&
                profiles.find((p) => p.user_id === disablingUserId)
                  ?.is_disabled ? (
                  <>
                    <UserX className="w-5 h-5 text-green-600" />
                    Enable User Account
                  </>
                ) : (
                  <>
                    <Ban className="w-5 h-5 text-red-600" />
                    Disable User Account
                  </>
                )}
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                {disablingUserId &&
                profiles.find((p) => p.user_id === disablingUserId)?.is_disabled
                  ? "Are you sure you want to enable this user account? They will regain access to their account."
                  : "Are you sure you want to disable this user account? They will lose access to their account until re-enabled."}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setDisableUserDialogOpen(false)}
                disabled={disablingUser !== null}
                className="border-border/50 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant={
                  disablingUserId &&
                  profiles.find((p) => p.user_id === disablingUserId)
                    ?.is_disabled
                    ? "default"
                    : "destructive"
                }
                onClick={() => {
                  if (disablingUserId) {
                    const profile = profiles.find(
                      (p) => p.user_id === disablingUserId,
                    );
                    if (profile) {
                      toggleUserDisable(disablingUserId, !profile.is_disabled);
                    }
                  }
                }}
                disabled={disablingUser !== null}
                className="w-full sm:w-auto"
              >
                {disablingUser ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Processing...
                  </>
                ) : disablingUserId &&
                  profiles.find((p) => p.user_id === disablingUserId)
                    ?.is_disabled ? (
                  "Enable Account"
                ) : (
                  "Disable Account"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete User Confirmation Dialog - Only for Super Admins */}
      {/* Delete User Confirmation Dialog - Only for Super Admins */}
      {isSuperAdmin && (
        <Dialog
          open={deleteUserDialogOpen}
          onOpenChange={setDeleteUserDialogOpen}
        >
          <DialogContent className="sm:max-w-md w-[90vw] max-w-[95vw]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Trash2 className="w-5 h-5 text-destructive" />
                Delete User Account
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Are you sure you want to delete the user account for{" "}
                <strong className="break-all">{deletingUserName}</strong>?
                <div className="mt-2 space-y-1">
                  <p className="text-sm">
                    This action will permanently remove:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>User profile information</li>
                    <li>User role assignments</li>
                    <li>Associated quote requests</li>
                    <li>All user data from the system</li>
                  </ul>
                </div>
                <p className="mt-3 font-semibold text-destructive">
                  This action cannot be undone!
                </p>
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteUserDialogOpen(false)}
                disabled={disablingUser !== null}
                className="border-border/50 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deletingUserId) {
                    deleteUser(deletingUserId, deletingUserName);
                  }
                }}
                disabled={disablingUser !== null}
                className="w-full sm:w-auto"
              >
                {disablingUser ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Deleting...
                  </>
                ) : (
                  "Delete User Permanently"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}