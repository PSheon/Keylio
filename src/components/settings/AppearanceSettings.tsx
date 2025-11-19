import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Moon, Globe } from "lucide-react";
import { useSettingsStore } from "@/stores/useSettingsStore";
import { toast } from "sonner";

export function AppearanceSettings() {
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const language = useSettingsStore((state) => state.language);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    toast.success(`已切換至 ${theme === 'dark' ? '淺色' : '深色'} 模式`);
  };

  const handleLanguageToggle = () => {
    setLanguage(language === 'zh-TW' ? 'en' : 'zh-TW');
    toast.success("語言已變更");
  };

  return (
    <Card className="bg-keylio-bg-secondary border-keylio-border-primary text-keylio-text-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="w-5 h-5 text-teal-400" />
          外觀與顯示
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">深色模式</Label>
            <p className="text-sm text-keylio-text-secondary">調整應用程式的主題顏色</p>
          </div>
          <Switch 
            checked={theme === 'dark'} 
            onCheckedChange={handleThemeToggle}
            className="data-[state=checked]:bg-teal-600"
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">語言 (Language)</Label>
            <p className="text-sm text-keylio-text-secondary">目前語言: {language === 'zh-TW' ? '繁體中文' : 'English'}</p>
          </div>
          <Button variant="outline" onClick={handleLanguageToggle} className="border-keylio-border-primary hover:bg-keylio-bg-tertiary hover:text-keylio-text-primary">
            <Globe className="w-4 h-4 mr-2" />
            切換語言
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
