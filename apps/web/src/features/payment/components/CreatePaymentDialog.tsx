// ============================================================================
// COM_PAY_08: CREATE PAYMENT DIALOG
// Enterprise-grade payment creation dialog for AP-05 Payment Execution Cell
// ============================================================================
// PHILOSOPHY: "Money is always a string. Validation before submission."
// - All money handled as string
// - Zod validation before API call
// - Idempotency built into API client
// ============================================================================

'use client';

import * as React from 'react';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AmountInput, type CurrencyCode } from './AmountInput';
import { paymentApi, PaymentApiError } from '../api/paymentApi';
import {
  SourceDocumentTypeSchema,
  type PaymentResponse,
} from '../schemas/paymentZodSchemas';
import { Loader2, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ============================================================================
// 1. TYPES
// ============================================================================

interface CreatePaymentDialogProps {
  /** Trigger element (button) */
  trigger?: React.ReactNode;
  /** Callback when payment is created successfully */
  onSuccess?: (payment: PaymentResponse) => void;
  /** Callback when dialog is closed */
  onClose?: () => void;
  /** Pre-filled vendor (for convenience) */
  defaultVendor?: {
    id: string;
    name: string;
  };
  /** Pre-filled source document */
  defaultSourceDocument?: {
    id: string;
    type: z.infer<typeof SourceDocumentTypeSchema>;
    ref?: string;
  };
}

interface FormState {
  vendorId: string;
  vendorName: string;
  amount: string;
  currency: CurrencyCode;
  paymentDate: string;
  dueDate: string;
  sourceDocumentType: string;
  invoiceRef: string;
}

interface FormErrors {
  vendorId?: string;
  vendorName?: string;
  amount?: string;
  paymentDate?: string;
}

// ============================================================================
// 2. VALIDATION
// ============================================================================

function validateForm(data: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!data.vendorId.trim()) {
    errors.vendorId = 'Vendor ID is required';
  }

  if (!data.vendorName.trim()) {
    errors.vendorName = 'Vendor name is required';
  }

  if (!data.amount.trim()) {
    errors.amount = 'Amount is required';
  } else if (!/^\d+(\.\d{1,4})?$/.test(data.amount)) {
    errors.amount = 'Invalid amount format';
  } else if (parseFloat(data.amount) <= 0) {
    errors.amount = 'Amount must be greater than zero';
  }

  if (!data.paymentDate) {
    errors.paymentDate = 'Payment date is required';
  }

  return errors;
}

// ============================================================================
// 3. COMPONENT
// ============================================================================

/**
 * CreatePaymentDialog - Enterprise payment creation dialog
 *
 * Key Features:
 * - Zod-validated form
 * - String-only money handling
 * - API error handling with user feedback
 * - Loading states and success confirmation
 *
 * @example
 * ```tsx
 * <CreatePaymentDialog
 *   trigger={<Button>New Payment</Button>}
 *   onSuccess={(payment) => console.log('Created:', payment)}
 * />
 * ```
 */
export function CreatePaymentDialog({
  trigger,
  onSuccess,
  onClose,
  defaultVendor,
  defaultSourceDocument,
}: CreatePaymentDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const [formErrors, setFormErrors] = React.useState<FormErrors>({});

  const [formData, setFormData] = React.useState<FormState>({
    vendorId: defaultVendor?.id ?? '',
    vendorName: defaultVendor?.name ?? '',
    amount: '',
    currency: 'USD',
    paymentDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    sourceDocumentType: defaultSourceDocument?.type ?? '',
    invoiceRef: defaultSourceDocument?.ref ?? '',
  });

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setError(null);
      setSuccess(false);
      setFormErrors({});
      setFormData({
        vendorId: defaultVendor?.id ?? '',
        vendorName: defaultVendor?.name ?? '',
        amount: '',
        currency: 'USD',
        paymentDate: new Date().toISOString().split('T')[0],
        dueDate: '',
        sourceDocumentType: defaultSourceDocument?.type ?? '',
        invoiceRef: defaultSourceDocument?.ref ?? '',
      });
    }
  }, [open, defaultVendor, defaultSourceDocument]);

  const updateField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user edits
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payment = await paymentApi.create({
        vendorId: formData.vendorId,
        vendorName: formData.vendorName,
        amount: formData.amount,
        currency: formData.currency,
        paymentDate: formData.paymentDate,
        dueDate: formData.dueDate || undefined,
        sourceDocumentType: formData.sourceDocumentType
          ? (formData.sourceDocumentType as z.infer<typeof SourceDocumentTypeSchema>)
          : undefined,
        invoiceRef: formData.invoiceRef || undefined,
      });

      setSuccess(true);

      // Delay close for user to see success
      setTimeout(() => {
        onSuccess?.(payment);
        setOpen(false);
      }, 1000);
    } catch (err) {
      if (err instanceof PaymentApiError) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle dialog close
  const handleOpenChange = (newOpen: boolean) => {
    if (!isSubmitting) {
      setOpen(newOpen);
      if (!newOpen) {
        onClose?.();
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Payment
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Create Payment</DialogTitle>
          <DialogDescription>
            Create a new payment request. The payment will be saved as a draft.
          </DialogDescription>
        </DialogHeader>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <AlertTitle className="text-emerald-600">Success</AlertTitle>
            <AlertDescription className="text-emerald-600">
              Payment created successfully!
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Vendor Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vendorId">Vendor ID</Label>
              <Input
                id="vendorId"
                placeholder="Enter vendor ID"
                value={formData.vendorId}
                onChange={(e) => updateField('vendorId', e.target.value)}
                disabled={isSubmitting}
                className={formErrors.vendorId ? 'border-destructive' : ''}
              />
              {formErrors.vendorId && (
                <p className="text-destructive text-sm">{formErrors.vendorId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input
                id="vendorName"
                placeholder="Enter vendor name"
                value={formData.vendorName}
                onChange={(e) => updateField('vendorName', e.target.value)}
                disabled={isSubmitting}
                className={formErrors.vendorName ? 'border-destructive' : ''}
              />
              {formErrors.vendorName && (
                <p className="text-destructive text-sm">{formErrors.vendorName}</p>
              )}
            </div>
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <AmountInput
                id="amount"
                value={formData.amount}
                onChange={(value) => updateField('amount', value)}
                currency={formData.currency}
                disabled={isSubmitting}
                error={!!formErrors.amount}
              />
              <p className="text-muted-foreground text-sm">
                Enter amount with up to 4 decimal places
              </p>
              {formErrors.amount && (
                <p className="text-destructive text-sm">{formErrors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => updateField('currency', value as CurrencyCode)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="JPY">JPY</SelectItem>
                  <SelectItem value="CHF">CHF</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) => updateField('paymentDate', e.target.value)}
                disabled={isSubmitting}
                className={formErrors.paymentDate ? 'border-destructive' : ''}
              />
              {formErrors.paymentDate && (
                <p className="text-destructive text-sm">{formErrors.paymentDate}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date (Optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => updateField('dueDate', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Source Document */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sourceDocumentType">Document Type (Optional)</Label>
              <Select
                value={formData.sourceDocumentType}
                onValueChange={(value) => updateField('sourceDocumentType', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="sourceDocumentType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="tax">Tax</SelectItem>
                  <SelectItem value="payroll">Payroll</SelectItem>
                  <SelectItem value="bank_fee">Bank Fee</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="prepayment">Prepayment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceRef">Invoice Reference</Label>
              <Input
                id="invoiceRef"
                placeholder="e.g., INV-2024-001"
                value={formData.invoiceRef}
                onChange={(e) => updateField('invoiceRef', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || success}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {success ? 'Created!' : 'Create Payment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// 4. EXPORTS
// ============================================================================

export type { CreatePaymentDialogProps };
