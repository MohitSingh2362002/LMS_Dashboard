import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const useFetch = (request, deps = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await request();
      setData(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load data");
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, setData, loading, refresh };
};

export default useFetch;
