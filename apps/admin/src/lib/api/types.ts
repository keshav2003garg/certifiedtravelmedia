export interface ApiError {
  success: boolean;
  error: string;
  message: string;
}

export interface BaseResponse {
  success: boolean;
  message: string;
}

export interface ApiData<Payload, Response> {
  payload: Payload;
  response: BaseResponse & {
    data: Response;
  };
}

export interface ExternalApiData<Payload, Response> {
  payload: Payload;
  response: Response;
}
