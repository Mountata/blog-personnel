export const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);

  if (seconds < 60)   return "À l'instant";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} j`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)} sem`;
  return new Date(date).toLocaleDateString('fr-FR');
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('fr-FR', {
    day:   'numeric',
    month: 'long',
    year:  'numeric'
  });
};