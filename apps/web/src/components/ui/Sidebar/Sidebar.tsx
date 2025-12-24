interface SidebarProps extends React.PropsWithChildren {
  isExpanded: boolean;
  expandedSize?: '230' | '350';
  position?: 'left' | 'right';
}

const Sidebar: React.FC<SidebarProps> = ({
  isExpanded,
  expandedSize = '230',
  position = 'left',
  children,
}) => {
  const innerWidth = expandedSize === '230' ? 'w-[230px]' : 'w-[350px]';
  const outerMaxWidth =
    expandedSize === '230' ? 'max-w-[230px]' : 'max-w-[350px]';

  return (
    <div
      className={`${position === 'left' ? 'border-r border-r-neutral-4' : 'border-l border-l-neutral-4'} transition-all px-[0px] py-[0px] overflow-hidden w-full h-full ${
        isExpanded ? outerMaxWidth : 'max-w-[0px]'
      }`}
    >
      <div className={`flex flex-col h-full gap-2-5 py-2-5 px-3 ${innerWidth}`}>
        {children}
      </div>
    </div>
  );
};

export default Sidebar;
