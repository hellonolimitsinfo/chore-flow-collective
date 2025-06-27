import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { HouseholdMember } from "@/hooks/useHouseholdMembers";

interface CreateExpenseData {
  household_id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_type: 'equal' | 'individual';
  owed_by: string[];
  bank_details: string;
  custom_amounts?: Record<string, number>;
}

interface AddExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateExpenseData) => Promise<any>;
  householdId: string;
  members: HouseholdMember[];
}

export const AddExpenseForm = ({ isOpen, onClose, onSubmit, householdId, members }: AddExpenseFormProps) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    paid_by: '',
    split_type: 'equal' as 'equal' | 'individual',
    owed_by: [] as string[],
    bank_details: '',
    custom_amounts: {} as Record<string, number>
  });

  const memberNames = members.map(m => m.full_name || m.email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.paid_by) {
      return;
    }

    const owedBy = formData.split_type === 'equal' ? memberNames : formData.owed_by;

    await onSubmit({
      household_id: householdId,
      description: formData.description,
      amount: parseFloat(formData.amount),
      paid_by: formData.paid_by,
      split_type: formData.split_type,
      owed_by: owedBy,
      bank_details: formData.bank_details,
      custom_amounts: formData.split_type === 'individual' ? formData.custom_amounts : undefined
    });

    // Reset form
    setFormData({
      description: '',
      amount: '',
      paid_by: '',
      split_type: 'equal',
      owed_by: [],
      bank_details: '',
      custom_amounts: {}
    });
    
    onClose();
  };

  const handleOwedByChange = (memberName: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        owed_by: [...prev.owed_by, memberName]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        owed_by: prev.owed_by.filter(name => name !== memberName),
        custom_amounts: Object.fromEntries(
          Object.entries(prev.custom_amounts).filter(([key]) => key !== memberName)
        )
      }));
    }
  };

  const handleCustomAmountChange = (memberName: string, amount: string) => {
    const numAmount = parseFloat(amount) || 0;
    setFormData(prev => ({
      ...prev,
      custom_amounts: {
        ...prev.custom_amounts,
        [memberName]: numAmount
      }
    }));
  };

  const handleSplitEqually = () => {
    const totalAmount = parseFloat(formData.amount) || 0;
    const equalAmount = totalAmount / formData.owed_by.length;
    const newCustomAmounts: Record<string, number> = {};
    
    formData.owed_by.forEach(member => {
      newCustomAmounts[member] = equalAmount;
    });
    
    setFormData(prev => ({
      ...prev,
      custom_amounts: newCustomAmounts
    }));
  };

  const getTotalEntered = () => {
    return Object.values(formData.custom_amounts).reduce((sum, amount) => sum + (amount || 0), 0);
  };

  const getRemaining = () => {
    const totalAmount = parseFloat(formData.amount) || 0;
    return totalAmount - getTotalEntered();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 text-gray-100 max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="e.g., Groceries, Rent, Utilities"
                className="bg-gray-700 border-gray-600 text-gray-100"
                required
              />
            </div>

            <div>
              <Label htmlFor="amount">Amount (£)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="bg-gray-700 border-gray-600 text-gray-100"
                required
              />
            </div>

            <div>
              <Label htmlFor="paid_by">Paid by</Label>
              <Select 
                value={formData.paid_by} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, paid_by: value }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                  <SelectValue placeholder="Select who paid" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {memberNames.map(name => (
                    <SelectItem key={name} value={name} className="text-gray-100">
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bank_details">Bank Details</Label>
              <Input
                id="bank_details"
                value={formData.bank_details}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_details: e.target.value }))}
                placeholder="e.g., Santander *1234, Monzo *5678"
                className="bg-gray-700 border-gray-600 text-gray-100"
              />
            </div>

            <div>
              <Label>Split Type</Label>
              <Select 
                value={formData.split_type} 
                onValueChange={(value: 'equal' | 'individual') => setFormData(prev => ({ ...prev, split_type: value }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  <SelectItem value="equal" className="text-gray-100">Split equally</SelectItem>
                  <SelectItem value="individual" className="text-gray-100">Select individuals</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.split_type === 'individual' && (
              <div>
                <Label>Owed by</Label>
                <div className="space-y-2 mt-2">
                  {memberNames.map(name => (
                    <div key={name} className="flex items-center space-x-2">
                      <Checkbox
                        id={name}
                        checked={formData.owed_by.includes(name)}
                        onCheckedChange={(checked) => handleOwedByChange(name, checked as boolean)}
                      />
                      <Label htmlFor={name} className="text-gray-300">{name}</Label>
                    </div>
                  ))}
                </div>

                {formData.owed_by.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <Label>Custom amounts</Label>
                    {formData.owed_by.map(name => (
                      <div key={name} className="flex items-center justify-between">
                        <span className="text-gray-300">{name}</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.custom_amounts[name] || ''}
                          onChange={(e) => handleCustomAmountChange(name, e.target.value)}
                          placeholder="0.00"
                          className="w-24 bg-gray-700 border-gray-600 text-gray-100"
                        />
                      </div>
                    ))}
                    
                    <div className="border-t border-gray-600 pt-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Total Entered:</span>
                        <span className="text-gray-100">£{getTotalEntered().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-300">Remaining:</span>
                        <span className={getRemaining() >= 0 ? "text-green-400" : "text-red-400"}>
                          £{getRemaining().toFixed(2)}
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      type="button" 
                      onClick={handleSplitEqually}
                      variant="outline"
                      className="w-full"
                    >
                      Split Equally
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                Add Expense
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
