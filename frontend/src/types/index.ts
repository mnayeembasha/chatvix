export interface UserType {
    _id?:string;
    fullName: string;
    email: string;
    profilePic?: string;
    password?: string;
    createdAt?: Date;
    updatedAt?: Date;
  }