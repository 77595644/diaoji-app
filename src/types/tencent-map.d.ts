// 腾讯地图 JS SDK 类型声明
declare namespace qq {
  const maps: {
    key: string
  }
  namespace maps {
    class Map {
      constructor(container: string | HTMLElement, opts?: MapOptions)
      setCenter(latLng: LatLng): void
      getCenter(): LatLng
      getZoom(): number
      setZoom(zoom: number): void
      panTo(latLng: LatLng): void
      event: {
        addListener(map: Map, event: string, handler: () => void): void
      }
    }
    class LatLng {
      constructor(lat: number, lng: number)
      getLat(): number
      getLng(): number
    }
    class MapMarker {
      constructor(opts: MarkerOptions)
      setMap(map: Map | null): void
      setPosition(latLng: LatLng): void
      setTitle(title: string): void
      getPosition(): LatLng
    }
    class MapLabel {
      constructor(opts: LabelOptions)
      setMap(map: Map | null): void
      setContent(content: string): void
    }
    class Geolocation {
      constructor()
      getLocation(opts?: GeolocationOptions): void
    }
    class ClientGeolocation {
      constructor()
      getLocation(opts?: ClientGeolocationOptions): void
    }
    interface MapOptions {
      zoom?: number
      center?: LatLng
      mapStyleId?: string
      disableDefaultUI?: boolean
      zoomControl?: boolean
    }
    interface MarkerOptions {
      position: LatLng
      map?: Map
      title?: string
      content?: string | HTMLElement
      icon?: MarkerImage
      zIndex?: number
    }
    interface LabelOptions {
      content: string
      position: LatLng
      map?: Map
      style?: LabelStyle
    }
    interface LabelStyle {
      color?: string
      fontSize?: string
      fontWeight?: string
      border?: string
      backgroundColor?: string
      borderRadius?: string
      padding?: string
    }
    interface MarkerImage {
      url: string
      size: { width: number; height: number }
      origin?: { x: number; y: number }
      anchor?: { x: number; y: number }
    }
    interface GeolocationOptions {
      complete?: (result: any) => void
      error?: (error: any) => void
      timeout?: number
    }
    interface ClientGeolocationOptions {
      complete?: (result: any) => void
      error?: (error: any) => void
      timeout?: number
    }
  }
}
