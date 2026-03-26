export interface SavedAddress {
  id: string;
  userId: string;
  label: string;
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  city: string;
  state: string;
  zipcode: string;
  country: string;
  phone: string;
  isDefault: boolean;
  createdAt: string;
}

export interface AddressListResponse {
  success: boolean;
  data: SavedAddress[];
}

export interface ProfileData {
  id: string;
  name: string;
  email: string;
}

export interface ProfileResponse {
  success: boolean;
  data: ProfileData;
}
