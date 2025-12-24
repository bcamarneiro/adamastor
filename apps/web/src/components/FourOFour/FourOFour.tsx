const FourOFour: React.FC<{ label?: string }> = ({ label = '404' }) => (
  <div className="h-full w-full flex flex-col items-center justify-center">
    <img src="/404-gandalf.gif" alt={label} />
    <p>{label}</p>
  </div>
);

export default FourOFour;
