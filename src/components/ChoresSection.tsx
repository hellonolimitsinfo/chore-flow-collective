
import { Calendar, Plus, CheckCircle, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const ChoresSection = () => {
  const chores = [
    {
      id: 1,
      title: "Take out bins",
      frequency: "Weekly",
      assignee: "Alex's turn",
      completed: true,
      color: "blue"
    },
    {
      id: 2,
      title: "Clean bathroom",
      frequency: "Bi-weekly",
      assignee: "Sam's turn",
      completed: true,
      color: "green"
    },
    {
      id: 3,
      title: "Vacuum living room",
      frequency: "Weekly",
      assignee: "Jordan's turn",
      completed: true,
      color: "purple"
    },
    {
      id: 4,
      title: "Clean kitchen",
      frequency: "Weekly",
      assignee: "Alex's turn",
      completed: true,
      color: "blue"
    }
  ];

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center text-white">
          <Calendar className="w-5 h-5 mr-2" />
          Current Chores
        </CardTitle>
        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-1" />
          Add Chore
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {chores.map((chore) => (
          <div key={chore.id} className="p-3 bg-slate-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-white">{chore.title}</h4>
              <Button size="sm" variant="ghost" className="text-slate-400">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-slate-300 border-slate-600">
                  {chore.frequency}
                </Badge>
                <span className={`text-sm text-${chore.color}-400`}>
                  {chore.assignee}
                </span>
              </div>
              <Button 
                size="sm" 
                className="bg-green-600 hover:bg-green-700"
                disabled={chore.completed}
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Done
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
