
import React, { createContext, useContext, useState } from 'react';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    'flatmate_flow': 'Flatmate Flow',
    'tagline': 'Keep track of chores, shopping, and responsibilities',
    'your_households': 'Your Households',
    'create_new': 'Create New',
    'no_households': 'No households yet. Create one to get started!',
    'urgent_items': 'Urgent Items Needed',
    'history': 'History',
    'chores': 'Chores',
    'current_chores': 'Current Chores',
    'shopping_items': 'Shopping Items',
    'expenses': 'Expenses',
    'settled_expenses': 'Settled Expenses',
    'loading': 'Loading...',
    'just_now': 'Just now',
    'hours_ago': 'h ago',
    'days_ago': 'd ago',
    'completed_by': 'Completed by',
    'purchased_by': 'Purchased by',
    'flagged_by': 'Flagged as low stock by',
    'says_paid': 'says they paid',
    'payment_confirmed': 'Payment confirmed from',
    'date_created': 'Date Created',
    'add_members': 'Add Members',
    'manage_members': 'Manage Members',
    'rename_household': 'Rename Household',
    'admin': 'Admin',
    'members': 'members',
    'add_chore': 'Add Chore',
    'add_item': 'Add Item',
    'add_expense': 'Add Expense',
    'add_examples': 'Add Examples',
    'bought': 'Bought',
    'low_stock': 'Low Stock',
    'flagged_by_user': 'Flagged by',
    'responsibility': 'responsibility',
    'no_chores_yet': 'No chores yet. Add one to get started!',
    'no_shopping_items_yet': 'No shopping items yet. Add some to get started!',
    'select_household_first': 'Select a household to view',
    'no_household_members': 'No household members found'
  },
  zh: {
    'flatmate_flow': '室友管理',
    'tagline': '跟踪家务、购物和责任分工',
    'your_households': '你的家庭',
    'create_new': '创建新的',
    'no_households': '还没有家庭。创建一个开始吧！',
    'urgent_items': '急需物品',
    'history': '历史记录',
    'chores': '家务',
    'current_chores': '当前家务',
    'shopping_items': '购物清单',
    'expenses': '支出',
    'settled_expenses': '已结算支出',
    'loading': '加载中...',
    'just_now': '刚刚',
    'hours_ago': '小时前',
    'days_ago': '天前',
    'completed_by': '完成者',
    'purchased_by': '购买者',
    'flagged_by': '标记库存不足者',
    'says_paid': '声称已付款',
    'payment_confirmed': '确认付款来自',
    'date_created': '创建日期',
    'add_members': '添加成员',
    'manage_members': '管理成员',
    'rename_household': '重命名家庭',
    'admin': '管理员',
    'members': '成员',
    'add_chore': '添加家务',
    'add_item': '添加物品',
    'add_expense': '添加支出',
    'add_examples': '添加示例',
    'bought': '已购买',
    'low_stock': '库存不足',
    'flagged_by_user': '标记者',
    'responsibility': '的责任',
    'no_chores_yet': '还没有家务。添加一个开始吧！',
    'no_shopping_items_yet': '还没有购物清单。添加一些开始吧！',
    'select_household_first': '先选择一个家庭来查看',
    'no_household_members': '未找到家庭成员'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['en']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
