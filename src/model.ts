// Shared data model for Northwind-based online shop

export interface Category {
  id: string;
  Name: string;
  Description?: string;
}

export interface Product {
  id: string;
  Name: string;
  CategoryId: string;
  QuantityPerUnit?: string;
  PricePerUnit: number;
  UnitsInStock: number;
  Discontinued: boolean;
}

export interface Company {
  id: string;
  Name: string;
  ContactName?: string;
  Address?: string;
  City?: string;
  Country?: string;
}

export interface OrderLine {
  Product: string; 
  ProductName: string;
  PricePerUnit: number;
  Quantity: number;
  Discount: number;
}

export interface ShipTo {
  City: string;
  Country: string;
  Line1: string;
  Line2?: string | null;
  Location: {
    Latitude: number;
    Longitude: number;
  };
  PostalCode: string;
  Region?: string | null;
}

export interface Order {
  id: string;
  CompanyId: string;
  OrderedAt: string;
  RequireAt?: string;
  ShippedAt?: string;
  CancelledAt: Date | null;
  ShipTo?: ShipTo;
  Lines: OrderLine[];
}

export interface CartItem {
  Product: string;
  ProductName: string;
  PricePerUnit: number;
  Quantity: number;
}

export interface Cart {
  id: string;
  Lines: CartItem[];
}
