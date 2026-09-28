export interface TowerShowcaseDialogProps {
  open: boolean;
  onClose: () => void;
  reducedMotion: boolean;
  selectedTower: string;
  onSelectTower: (id: string) => void;
}
