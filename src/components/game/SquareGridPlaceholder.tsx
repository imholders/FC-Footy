const SquareGridPlaceholder = () => (
    <div className="grid grid-cols-5 gap-2 mt-6 animate-pulse">
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={i}
          className="h-16 w-16 bg-gray-700 rounded-md flex items-center justify-center"
        >
          <div className="h-6 w-6 bg-gray-600 rounded-full" />
        </div>
      ))}
    </div>
  );
  
  export default SquareGridPlaceholder;
  