
import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

export const UrgentItems = () => {
  const { theme } = useTheme();
  
  const urgentItems = [
    {
      id: 1,
      title: "Toilet Paper",
      description: "Flagged by Sam",
      assignee: "Sam's turn",
      type: "shopping",
      action: "Bought"
    },
    {
      id: 2,
      title: "Internet Bill - £60.00",
      description: "You owe £20.00",
      assignee: "Paid by Sam",
      type: "expense",
      action: "Mark Paid"
    }
  ];

  return (
    <Card className={theme === 'light' 
      ? 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 shadow-sm' 
      : 'bg-gradient-to-r from-orange-900/30 to-red-900/30 border-orange-600/50'
    }>
      <CardHeader>
        <CardTitle className={`flex items-center ${theme === 'light' ? 'text-orange-800' : 'text-orange-200'}`}>
          <AlertTriangle className="w-5 h-5 mr-2" />
          Urgent Items Needed
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {urgentItems.map((item) => (
          <div 
            key={item.id} 
            className={`flex items-center justify-between p-3 rounded-lg ${
              theme === 'light' 
                ? 'bg-white border border-orange-200 shadow-sm' 
                : 'bg-slate-800/50'
            }`}
          >
            <div className="flex-1">
              <h4 className={`font-medium ${theme === 'light' ? 'text-[#111111]' : 'text-white'}`}>{item.title}</h4>
              <p className={`text-sm ${theme === 'light' ? 'text-[#666666]' : 'text-slate-400'}`}>{item.description}</p>
              <p className={`text-sm ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>{item.assignee}</p>
            </div>
            <Button 
              size="sm" 
              className={`${
                item.type === 'shopping' 
                  ? (theme === 'light' ? 'bg-green-600 hover:bg-green-700 text-white shadow-sm' : 'bg-green-600 hover:bg-green-700')
                  : (theme === 'light' ? 'bg-[#007BFF] hover:bg-[#0056b3] text-white shadow-sm' : 'bg-blue-600 hover:bg-blue-700')
              }`}
            >
              {item.action}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
