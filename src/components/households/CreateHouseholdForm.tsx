
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, X } from "lucide-react";

interface CreateHouseholdFormProps {
  onCreateHousehold: (name: string, description?: string) => Promise<any>;
  isOpen: boolean;
  onClose: () => void;
}

export const CreateHouseholdForm = ({ onCreateHousehold, isOpen, onClose }: CreateHouseholdFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const result = await onCreateHousehold(name.trim(), description.trim() || undefined);
    setLoading(false);

    if (result) {
      setName("");
      setDescription("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Household</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Household Name</label>
            <Input
              placeholder="Enter household name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Description (Optional)</label>
            <Input
              placeholder="Enter household description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
            />
          </div>

          <div className="flex space-x-2">
            <Button 
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              disabled={loading || !name.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              {loading ? "Creating..." : "Create Household"}
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
