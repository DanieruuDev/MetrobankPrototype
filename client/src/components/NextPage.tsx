import { ArrowLeft, ArrowRight, Ellipsis } from "lucide-react";

const NextPage = () => {
  const buttonClass = "hover:bg-gray-400 hover:text-white rounded-lg py-2 px-4";

  return (
    <div className=" fixed bottom-0 left-0 w-full flex justify-center bg-white py-2 shadow-md">
      <div className="flex items-center space-x-2 text-xs text-gray-600">
        <button className={buttonClass}>
          <ArrowLeft size={20} />
        </button>
        <button className={buttonClass}>1</button>
        <button className={buttonClass}>2</button>
        <button className={buttonClass}>3</button>
        <button className={`hidden md:block ${buttonClass}`}>
          <Ellipsis />
        </button>
        <button className={`hidden md:block ${buttonClass}`}>67</button>
        <button className={`hidden md:block ${buttonClass}`}>68</button>

        <button className={buttonClass}>
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default NextPage;
