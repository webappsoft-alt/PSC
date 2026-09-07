import {useEffect, useState} from 'react';

import {get} from '../services/ApiRequest';

const useGetProfile = () => {
  const [user, setUser] = useState(null);

  const getProfile = async () => {
    try {
      const res = await get('auth/me');
      setUser(res?.data?.data);
    } catch (error) {}
  };

  useEffect(() => {
    getProfile();
  }, []);

  return user;
};

export default useGetProfile;
