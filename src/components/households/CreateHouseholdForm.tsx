
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

interface CreateHouseholdFormProps {
  onCreateHousehold: (name: string, description?: string) => Promise<any>;
  onCancel: () => void;
}

export const CreateHouseholdForm = ({ onCreateHousehold, onCancel }: CreateHouseholdFormProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    const result = await onCreateHousehold(name.trim(), description.trim() || undefined);
    setLoading(false);

    if (result) {
      setName("");
      setDescription("");
      onCancel();
    }
  };

  return (
    <Card className={theme === 'light' ? 'light-card' : 'bg-slate-800 border-slate-700'}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={theme === 'light' ? 'text-[#111111]' : 'text-white'}>Create New Household</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className={theme === 'light' ? 'text-[#666666] hover:text-[#111111] hover:bg-gray-100' : 'text-slate-400 hover:text-white'}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme === 'light' ? 'text-[#333333]' : 'text-slate-300'}`}>Household Name</label>
            <Input
              placeholder="Enter household name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={theme === 'light' 
                ? 'bg-white border-[#ddd] text-[#111111] placeholder-[#888888]' 
                : 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
              }
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className={`text-sm font-medium ${theme === 'light' ? 'text-[#333333]' : 'text-slate-300'}`}>Description (Optional)</label>
            <Input
              placeholder="Enter household description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={theme === 'light' 
                ? 'bg-white border-[#ddd] text-[#111111] placeholder-[#888888]' 
                : 'bg-slate-700 border-slate-600 text-white placeholder-slate-400'
              }
            />
          </div>

          <div className="flex space-x-2">
            <Button 
              type="submit"
              className={`flex-1 ${theme === 'light' ? 'bg-[#007BFF] hover:bg-[#0056b3] text-white shadow-sm' : 'bg-blue-600 hover:bg-blue-700'}`}
              disabled={loading || !name.trim()}
            >
              <Plus className="w-4 h-4 mr-2" />
              {loading ? "Creating..." : "Create Household"}
            </Button>
            <Button 
              type="button"
              variant="outline" 
              onClick={onCancel}
              className={theme === 'light' 
                ? 'bg-white border-[#ddd] text-[#333333] hover:bg-gray-50' 
                : 'border-slate-600 text-slate-300 hover:bg-slate-700'
              }
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
