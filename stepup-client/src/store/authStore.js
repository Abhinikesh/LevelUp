import useStore from './useStore';

const useAuthStore = (selector) => {
  return useStore((state) => {
    const mapped = {
      user: state.user,
      token: state.token,
      isLoading: false,
      isInitialized: true,
      setAuth: state.setAuth,
      setUser: state.updateUser,
      logout: state.logout,
      initialize: () => {},
      addXp: state.addXP,
    };
    return selector ? selector(mapped) : mapped;
  });
};

useAuthStore.getState = () => {
  const state = useStore.getState();
  return {
    user: state.user,
    token: state.token,
    isLoading: false,
    isInitialized: true,
    setAuth: state.setAuth,
    setUser: state.updateUser,
    logout: state.logout,
    initialize: () => {},
    addXp: state.addXP,
  };
};

export default useAuthStore;
