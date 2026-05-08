require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'HermnetTor'
  s.version        = package['version']
  s.summary        = package['description']
  s.license        = 'MIT'
  s.author         = 'Hermnet'
  s.homepage       = 'https://github.com/alvarogrlp/Hermnet'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.4'
  s.source         = { :git => 'https://github.com/alvarogrlp/Hermnet' }
  s.source_files   = '**/*.{h,m,swift}'

  s.dependency 'ExpoModulesCore'

  # Tor.framework empotrado (mantenido por iCepa, lo usa Onion Browser).
  # Versión 408.x es estable a fecha 2026-05.
  s.dependency 'Tor', '~> 408.20'
end
