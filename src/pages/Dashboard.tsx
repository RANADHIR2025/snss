import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/layout/PageHeader';
import { User, Send, Calendar, Mail, Phone, FileText, Clock, CheckCircle, XCircle, Loader2, Package, Download, FileSpreadsheet, FileDown, Edit, Trash2, Save, Search, ChevronDown, ChevronUp, Filter, Copy, MoreVertical } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { exportToExcel, exportToPDF, quoteColumns } from '@/lib/exportUtils';
import { validateDashboardQuote } from '@/lib/validationSchemas';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Profile {
  full_name: string;
  email: string;
  phone: string | null;
  joined_at: string;
}

interface QuoteRequest {
  id: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  quantity: number | null;
  product_specifications: string | null;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [quoteRequests, setQuoteRequests] = useState<QuoteRequest[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const { toast } = useToast();
  const navigate = useNavigate();

  // Edit/Delete state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuoteRequest | null>(null);
  const [deletingQuoteId, setDeletingQuoteId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ subject: '', message: '' });
  const [saving, setSaving] = useState(false);

  // Expand/Collapse state
  const [expandedQuotes, setExpandedQuotes] = useState<Set<string>>(new Set());

  // Date filter state
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, email, phone, joined_at')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
  }, [user]);

  const fetchQuoteRequests = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setQuoteRequests(data);
      setFilteredQuotes(data);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchQuoteRequests();
    }
  }, [user, fetchProfile, fetchQuoteRequests]);

  // Filter quotes based on date range and search
  useEffect(() => {
    let filtered = [...quoteRequests];

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case '7days':
          startDate = subDays(now, 7);
          break;
        case '30days':
          startDate = subDays(now, 30);
          break;
        case 'custom':
          if (customStartDate && customEndDate) {
            const start = startOfDay(new Date(customStartDate));
            const end = endOfDay(new Date(customEndDate));
            filtered = filtered.filter(quote => {
              const quoteDate = new Date(quote.created_at);
              return quoteDate >= start && quoteDate <= end;
            });
          }
          break;
      }

      if (dateFilter !== 'custom') {
        filtered = filtered.filter(quote => {
          const quoteDate = new Date(quote.created_at);
          return quoteDate >= startDate!;
        });
      }
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(quote =>
        quote.subject.toLowerCase().includes(query) ||
        quote.message.toLowerCase().includes(query) ||
        quote.status.toLowerCase().includes(query)
      );
    }

    setFilteredQuotes(filtered);
  }, [quoteRequests, dateFilter, customStartDate, customEndDate, searchQuery]);

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateDashboardQuote({
      subject: formData.subject,
      message: formData.message,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: 'Validation Error',
        description: firstError?.message || 'Please check your inputs',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    const { data: insertData, error } = await supabase.from('quote_requests').insert({
      user_id: user!.id,
      subject: validation.data.subject,
      message: validation.data.message,
    }).select('id').single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit quote request. Please try again.',
        variant: 'destructive',
      });
    } else {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && insertData) {
          await supabase.functions.invoke('send-quote-confirmation', {
            body: { quote_request_id: insertData.id },
          });
        }
      } catch (emailError) {
        console.log('Email notification skipped');
      }

      toast({
        title: 'Quote request submitted!',
        description: 'Our team will review your request and get back to you. A confirmation email has been sent.',
      });
      setFormData({ subject: '', message: '' });
      fetchQuoteRequests();
    }

    setSubmitting(false);
  };

  const openEditDialog = (quote: QuoteRequest) => {
    if (quote.status !== 'pending') {
      toast({
        title: 'Cannot Edit',
        description: 'Only pending quote requests can be edited.',
        variant: 'destructive',
      });
      return;
    }
    setEditingQuote(quote);
    setEditForm({ subject: quote.subject, message: quote.message });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingQuote) return;

    const validation = validateDashboardQuote(editForm);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: 'Validation Error',
        description: firstError?.message || 'Please check your inputs',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('quote_requests')
      .update({
        subject: validation.data.subject,
        message: validation.data.message,
      })
      .eq('id', editingQuote.id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update quote request. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Quote Updated',
        description: 'Your quote request has been updated successfully.',
      });
      setEditDialogOpen(false);
      setEditingQuote(null);
      fetchQuoteRequests();
    }
    setSaving(false);
  };

  const openDeleteDialog = (quoteId: string, status: string) => {
    if (status !== 'pending') {
      toast({
        title: 'Cannot Delete',
        description: 'Only pending quote requests can be deleted.',
        variant: 'destructive',
      });
      return;
    }
    setDeletingQuoteId(quoteId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteQuote = async () => {
    if (!deletingQuoteId) return;

    setSaving(true);
    const { error } = await supabase
      .from('quote_requests')
      .delete()
      .eq('id', deletingQuoteId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete quote request. Please try again.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Quote Deleted',
        description: 'Your quote request has been deleted.',
      });
      setDeleteDialogOpen(false);
      setDeletingQuoteId(null);
      fetchQuoteRequests();
    }
    setSaving(false);
  };

  const handleExportQuotes = (type: 'excel' | 'pdf') => {
    const exportData = filteredQuotes.map((request) => ({
      subject: request.subject,
      productName: request.product_specifications ? 'Custom' : '-',
      quantity: request.quantity || 1,
      message: request.message,
      status: request.status.charAt(0).toUpperCase() + request.status.slice(1),
      date: format(new Date(request.created_at), 'MMM d, yyyy'),
    }));

    if (type === 'excel') {
      exportToExcel(exportData, quoteColumns, 'my_quote_requests');
    } else {
      exportToPDF(exportData, quoteColumns, 'my_quote_requests', 'My Quote Requests');
    }
  };

  const toggleQuoteExpansion = (quoteId: string) => {
    const newExpanded = new Set(expandedQuotes);
    if (newExpanded.has(quoteId)) {
      newExpanded.delete(quoteId);
    } else {
      newExpanded.add(quoteId);
    }
    setExpandedQuotes(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Quote details copied to clipboard',
      duration: 2000,
    });
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all duration-300";
    
    switch (status) {
      case 'approved':
        return (
          <span className={`${baseClasses} bg-green-100 text-green-700 border border-green-200/50 shadow-sm`}>
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case 'rejected':
        return (
          <span className={`${baseClasses} bg-red-100 text-red-700 border border-red-200/50 shadow-sm`}>
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className={`${baseClasses} bg-amber-100 text-amber-700 border border-amber-200/50 shadow-sm`}>
            <Clock className="w-3 h-3" /> Pending
          </span>
        );
    }
  };

  const handleResetFilters = () => {
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSearchQuery('');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
          <div className="absolute inset-0 rounded-2xl border border-primary/30 animate-pulseGlow"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <PageHeader />

      <main className="container-width px-4 sm:px-6 lg:px-8 py-8 pt-24 animate-fadeInUp">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Welcome, <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{profile?.full_name || 'User'}</span>!
          </h1>
          <p className="text-muted-foreground">Manage your profile and submit quote requests.</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl shadow-card border border-border/50 p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-sky flex items-center justify-center">
                  <User className="w-8 h-8 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-semibold text-foreground">Profile</h2>
                  <p className="text-sm text-muted-foreground">Your account details</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <User className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium text-foreground">{profile?.full_name || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{profile?.email || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Phone className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">{profile?.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Member Since</p>
                    <p className="font-medium text-foreground">
                      {profile?.joined_at ? format(new Date(profile.joined_at), 'MMMM d, yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quote Request Form & History */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quote Request Form - Clean Design */}
            <div className="relative">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary via-primary/50 to-primary opacity-20 blur-lg animate-pulse"></div>
              <div className="relative bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
                {/* Animated Border */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-slideRight"></div>
                
                {/* Animated Corner Dots */}
                <div className="absolute top-3 left-3 w-2 h-2 bg-primary rounded-full animate-bounce-gentle"></div>
                <div className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full animate-bounce-gentle" style={{animationDelay: '0.2s'}}></div>
                <div className="absolute bottom-3 left-3 w-2 h-2 bg-primary rounded-full animate-bounce-gentle" style={{animationDelay: '0.4s'}}></div>
                <div className="absolute bottom-3 right-3 w-2 h-2 bg-primary rounded-full animate-bounce-gentle" style={{animationDelay: '0.6s'}}></div>

                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-sky flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-xl bg-primary/20 animate-ping opacity-75"></div>
                      <Send className="w-6 h-6 text-primary-foreground relative z-10" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-semibold text-foreground">Request a Quote</h2>
                      <p className="text-sm text-muted-foreground">Tell us about your project</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitQuote} className="space-y-4 relative z-10">
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
                      <Input
                        id="subject"
                        placeholder="e.g., Cloud Migration Project"
                        value={formData.subject}
                        onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                        className="border-border/50 focus:border-primary transition-all duration-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-sm font-medium">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Describe your requirements in detail..."
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                        className="border-border/50 focus:border-primary transition-all duration-300 resize-none"
                      />
                    </div>

                    <Button 
                      type="submit" 
                      variant="hero" 
                      disabled={submitting}
                      className="w-full sm:w-auto transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2 relative z-10" />
                          <span className="relative z-10">Submitting...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2 relative z-10" />
                          <span className="relative z-10">Submit Request</span>
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            </div>

            {/* Quote Request History */}
            <div className="bg-card rounded-2xl shadow-card border border-border/50 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-sky flex items-center justify-center">
                      <FileText className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="font-display text-xl font-semibold text-foreground">Your Requests</h2>
                      <p className="text-sm text-muted-foreground">Track your quote request status</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {filteredQuotes.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Download className="w-4 h-4" />
                            Export
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="animate-slideIn">
                          <DropdownMenuItem onClick={() => handleExportQuotes('excel')}>
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            Export to Excel
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportQuotes('pdf')}>
                            <FileDown className="w-4 h-4 mr-2" />
                            Export to PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="mb-8 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search quotes by subject, message, or status..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 border-border/50"
                      />
                    </div>
                    
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Filter className="w-4 h-4" />
                          Filter by Date
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <h4 className="font-medium">Date Range</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant={dateFilter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setDateFilter('all')}
                              >
                                All Time
                              </Button>
                              <Button
                                variant={dateFilter === '7days' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setDateFilter('7days')}
                              >
                                Last 7 Days
                              </Button>
                              <Button
                                variant={dateFilter === '30days' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setDateFilter('30days')}
                              >
                                Last 30 Days
                              </Button>
                              <Button
                                variant={dateFilter === 'custom' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setDateFilter('custom')}
                              >
                                Custom
                              </Button>
                            </div>
                          </div>
                          
                          {dateFilter === 'custom' && (
                            <div className="space-y-3">
                              <div className="space-y-2">
                                <Label htmlFor="start-date" className="text-sm">Start Date</Label>
                                <Input
                                  id="start-date"
                                  type="date"
                                  value={customStartDate}
                                  onChange={(e) => setCustomStartDate(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="end-date" className="text-sm">End Date</Label>
                                <Input
                                  id="end-date"
                                  type="date"
                                  value={customEndDate}
                                  onChange={(e) => setCustomEndDate(e.target.value)}
                                />
                              </div>
                            </div>
                          )}
                          
                          {(dateFilter !== 'all' || searchQuery) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleResetFilters}
                              className="w-full"
                            >
                              Clear Filters
                            </Button>
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  {(dateFilter !== 'all' || searchQuery) && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Showing {filteredQuotes.length} of {quoteRequests.length} requests</span>
                      <span className="text-primary">•</span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={handleResetFilters}
                        className="h-auto p-0"
                      >
                        Reset filters
                      </Button>
                    </div>
                  )}
                </div>

                {filteredQuotes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium mb-2">No quote requests found</p>
                    <p className="text-sm">
                      {quoteRequests.length === 0 
                        ? "Submit your first request above!" 
                        : "Try adjusting your search or filters"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredQuotes.map((request, index) => {
                      const isExpanded = expandedQuotes.has(request.id);
                      const showMultiProduct = request.message.includes('Multi-Product');
                      
                      return (
                        <div
                          key={request.id}
                          className="group p-5 rounded-xl bg-gradient-to-br from-card via-card to-muted/5 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg animate-slideIn relative"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {/* Main Quote Card */}
                          <div className="flex flex-col">
                            {/* Header with Subject and Status */}
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-foreground text-lg mb-2">
                                  {request.subject}
                                </h3>
                                <div className="flex flex-wrap items-center gap-3 mb-2">
                                  {getStatusBadge(request.status)}
                                </div>
                              </div>
                              
                              {/* More Options Dropdown */}
                              {request.status === 'pending' && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => openEditDialog(request)}>
                                      <Edit className="w-4 h-4 mr-2" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      onClick={() => openDeleteDialog(request.id, request.status)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>

                            {/* Quantity and Date */}
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center gap-1">
                                <Package className="w-4 h-4" />
                                <span className="font-medium">Quantity: {request.quantity || 1}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Submitted on {format(new Date(request.created_at), 'MMM d, yyyy')}</span>
                              </div>
                            </div>

                            {/* Message Preview */}
                            <div className="mb-4">
                              <p className="text-muted-foreground text-sm line-clamp-2">
                                {request.message}
                              </p>
                            </div>

                            {/* Expand/Collapse Button */}
                            <div className="flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                                onClick={() => toggleQuoteExpansion(request.id)}
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                    Show Less
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    Show Details
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* Expandable Details */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-border/30 animate-fadeInUp">
                                <div className="space-y-4">
                                  {/* Full Message */}
                                  <div>
                                    <h4 className="text-sm font-semibold text-foreground mb-2">Full Message</h4>
                                    <div className="p-3 rounded-lg bg-muted/30 border border-border/30">
                                      <p className="text-sm whitespace-pre-wrap">{request.message}</p>
                                    </div>
                                  </div>

                                  {/* Request Info */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-sm font-semibold text-foreground mb-2">Request Details</h4>
                                      <div className="space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-xs text-muted-foreground">Request ID</span>
                                          <span className="text-xs font-medium font-mono">{request.id.slice(0, 8)}...</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-xs text-muted-foreground">Submitted Date</span>
                                          <span className="text-xs font-medium">
                                            {format(new Date(request.created_at), 'MMM d, yyyy, h:mm a')}
                                          </span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-xs text-muted-foreground">Status</span>
                                          <span className="text-xs font-medium capitalize">{request.status}</span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Copy Button in Details Section */}
                                    <div>
                                      <h4 className="text-sm font-semibold text-foreground mb-2">Actions</h4>
                                      <div className="space-y-2">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-full gap-2"
                                          onClick={() => copyToClipboard(`${request.subject}\n\n${request.message}`)}
                                        >
                                          <Copy className="w-4 h-4" />
                                          Copy Quote Details
                                        </Button>
                                        <p className="text-xs text-muted-foreground">
                                          Copy all quote details to clipboard for sharing
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Multi-Product Details */}
                                  {showMultiProduct && (
                                    <div>
                                      <h4 className="text-sm font-semibold text-foreground mb-2">Product Details</h4>
                                      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                                        <p className="text-sm font-medium text-primary mb-2">Multi-Product Quote Request</p>
                                        <div className="space-y-1">
                                          {request.message.split('·').slice(1).map((product, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                              <div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>
                                              <span className="text-xs text-muted-foreground">
                                                {product.trim()}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Hover Effect Border */}
                          <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-primary/10 transition-all duration-300 pointer-events-none"></div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Quote Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md animate-slideIn">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit Quote Request
            </DialogTitle>
            <DialogDescription>
              Update your quote request details below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-subject">Subject</Label>
              <Input
                id="edit-subject"
                value={editForm.subject}
                onChange={(e) => setEditForm((prev) => ({ ...prev, subject: e.target.value }))}
                className="border-border/50 focus:border-primary transition-all duration-300"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-message">Message</Label>
              <Textarea
                id="edit-message"
                value={editForm.message}
                onChange={(e) => setEditForm((prev) => ({ ...prev, message: e.target.value }))}
                rows={5}
                className="border-border/50 focus:border-primary transition-all duration-300 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)} 
              disabled={saving}
              className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit} 
              disabled={saving}
              className="transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="animate-slideIn">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote Request?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your quote request.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuote}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}