
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface AddChoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChore: (name: string, frequency: string, assigneeId: string) => Promise<void>;
  householdMembers: Array<{ user_id: string; full_name: string | null }>;
}

interface ChoreFormData {
  name: string;
  frequency: string;
}

export const AddChoreDialog = ({ isOpen, onClose, onAddChore, householdMembers }: AddChoreDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChoreFormData>({
    defaultValues: {
      name: "",
      frequency: "weekly"
    }
  });

  const handleSubmit = async (data: ChoreFormData) => {
    if (isSubmitting || householdMembers.length === 0) return;

    setIsSubmitting(true);
    try {
      // Automatically assign to the first household member
      const firstMember = householdMembers[0];
      await onAddChore(data.name, data.frequency, firstMember.user_id);
      form.reset();
      onClose();
    } catch (error) {
      console.error('Error adding chore:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Add New Chore</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Chore name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chore Name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Enter chore name"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || householdMembers.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "Adding..." : "Add Chore"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
