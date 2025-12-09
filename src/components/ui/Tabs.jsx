import React, { useState, createContext, useContext } from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

// Create context for tabs
const TabsContext = createContext();

export const Tabs = ({ children, defaultValue, className }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={clsx('w-full', className)}>{children} </div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className }) => {
  return (
    <div className={clsx( 'inline-flex bg-slate-100 rounded-lg p-1 gap-1', className)}>
      {children}
    </div>
  );
};

export const TabsTrigger = ({ children, value, disabled }) => {
  const context = useContext(TabsContext);
  
  if (!context) {
    console.error('TabsTrigger must be used within Tabs');
    return null;
  }

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  const handleClick = () => {
    if (!disabled) {
      console.log('Tab clicked:', value);
      setActiveTab(value);
    }
  };

  return (
    <button
      onClick={handleClick} disabled={disabled}
      className={clsx(
        'relative px-6 py-2.5 rounded-md font-semibold text-sm transition-all duration-300',
        disabled && 'opacity-50 cursor-not-allowed',
        isActive
          ? 'text-indigo-600'
          : 'text-slate-600 hover:text-slate-900',
        !disabled && 'cursor-pointer'
      )}
    >
      {isActive && !disabled && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-white rounded-md shadow-sm"
          transition={{ type: 'spring', duration: 0.5, bounce: 0.2 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  );
};

export const TabsContent = ({ children, value }) => {
  const context = useContext(TabsContext);
  
  if (!context) {
    console.error('TabsContent must be used within Tabs');
    return null;
  }

  const { activeTab } = context;

  if (activeTab !== value) return null;

  return (
    <motion.div
      key={value} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }} className="mt-6"
    >
      {children}
    </motion.div>
  );
};