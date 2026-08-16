export type RsvpChild = {
  name: string;
  guestId?: string;
  custom?: boolean;
};

export type RsvpPayload = {
  contactName: string;
  guestId?: string;
  group?: string;
  phone?: string;
  attending: "yes" | "no";
  guests: string[];
  children: RsvpChild[];
  message?: string;
};

export type RsvpRecord = RsvpPayload & {
  id: string;
  createdAt: string;
};
