import { useState, useEffect } from "react";

export const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      const height = window.innerHeight - window.visualViewport.height;
      setKeyboardHeight(Math.max(0, height));
    };

    window.visualViewport.addEventListener("resize", handleResize);
    return () =>
      window.visualViewport.removeEventListener("resize", handleResize);
  }, []);

  return keyboardHeight;
};
