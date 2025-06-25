
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLanguage } from "@/contexts/LanguageContext";

export const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <ToggleGroup 
      type="single" 
      value={language} 
      onValueChange={(value) => value && setLanguage(value as 'en' | 'zh')}
      className="bg-gray-800 border border-gray-700 rounded-md"
    >
      <ToggleGroupItem 
        value="en" 
        className="text-white data-[state=on]:bg-blue-600 data-[state=on]:text-white"
      >
        EN
      </ToggleGroupItem>
      <ToggleGroupItem 
        value="zh" 
        className="text-white data-[state=on]:bg-blue-600 data-[state=on]:text-white"
      >
        中文
      </ToggleGroupItem>
    </ToggleGroup>
  );
};
