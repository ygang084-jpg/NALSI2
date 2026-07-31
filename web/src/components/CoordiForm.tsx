import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { LocationValue } from '@/types/location'

type CoordiFormProps = {
  onSubmit: (location: LocationValue | null, photos: File[]) => void
}

export function CoordiForm({ onSubmit }: CoordiFormProps) {
  const [location, setLocation] = useState<LocationValue | null>(null)
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [locationError, setLocationError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photos])

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      setLocationError('이 브라우저에서는 위치 정보를 사용할 수 없어요.')
      return
    }
    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          type: 'coords',
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        })
        setLocationStatus('idle')
      },
      () => {
        setLocationStatus('error')
        setLocationError('위치 정보를 가져오지 못했어요. 지역명을 검색해주세요.')
      },
    )
  }

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setLocation({ type: 'query', query: searchQuery.trim() })
    setLocationStatus('idle')
  }

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPhotos(e.target.files ? Array.from(e.target.files) : [])
  }

  const mode = photos.length > 0 ? '보유 옷 코디' : '기본 코디'

  const handleRecommend = () => {
    console.log('오늘의 코디 추천 클릭', { mode, location, photos })
    onSubmit(location, photos)
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader>
            <CardTitle>위치 입력</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleUseCurrentLocation}
              disabled={locationStatus === 'loading'}
            >
              {locationStatus === 'loading' ? '위치 확인 중...' : '현재 위치 사용'}
            </Button>

            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <Input
                placeholder="지역명을 검색하세요"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" className="shrink-0">
                검색
              </Button>
            </form>

            {locationStatus === 'error' && (
              <p className="text-sm text-destructive">{locationError}</p>
            )}

            <p className="text-sm text-muted-foreground">
              {location === null && '위치가 아직 선택되지 않았어요.'}
              {location?.type === 'coords' &&
                `현재 위치: ${location.lat.toFixed(4)}, ${location.lon.toFixed(4)}`}
              {location?.type === 'query' && `검색한 지역: ${location.query}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>옷 사진 업로드 (선택)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              옷 사진이 없어도 추천받을 수 있어요.
            </p>

            <Input type="file" accept="image/*" multiple onChange={handlePhotoChange} />

            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {previewUrls.map((url, i) => (
                  <img
                    key={url}
                    src={url}
                    alt={`업로드한 옷 사진 ${i + 1}`}
                    className="aspect-square w-full rounded-md border object-cover"
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col items-center gap-2 py-2">
        <p className="text-sm font-medium">
          {photos.length > 0
            ? '보유 옷 코디 모드로 추천해요'
            : '기본 코디 모드로 추천해요'}
        </p>
        <Button size="lg" onClick={handleRecommend}>
          오늘의 코디 추천
        </Button>
      </div>
    </section>
  )
}
